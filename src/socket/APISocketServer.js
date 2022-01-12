/*
 *
 * This WebSocket is used for connecting
 * to minecraft server.
 * The minecraft server can set pixels and report user logins
 * and more.
 *
 * @flow */


import WebSocket from 'ws';

import socketEvents from './SocketEvents';
import { getIPFromRequest } from '../utils/ip';
import { setPixelByCoords } from '../core/setPixel';
import logger from '../core/logger';
import { APISOCKET_KEY } from '../core/config';

function heartbeat() {
  this.isAlive = true;
}

async function verifyClient(info, done) {
  const { req } = info;
  const { headers } = req;
  const ip = getIPFromRequest(req);

  if (!headers.authorization
    || !APISOCKET_KEY
    || headers.authorization !== `Bearer ${APISOCKET_KEY}`) {
    logger.warn(`API ws request from ${ip} authenticated`);
    return done(false);
  }
  logger.warn(`API ws request from ${ip} successfully authenticated`);
  return done(true);
}


class APISocketServer {
  wss: WebSocket.Server;

  constructor() {
    logger.info('Starting API websocket server');

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      clientTracking: true,
      maxPayload: 65536,
      // path: "/mcws",
      // server,
      noServer: true,
      verifyClient,
    });
    this.wss = wss;

    wss.on('error', (e) => {
      logger.error(`APIWebSocket Server Error ${e.message}`);
    });

    wss.on('connection', async (ws) => {
      ws.isAlive = true;
      ws.subChat = false;
      ws.subPxl = false;
      ws.subOnline = false;
      ws.on('pong', heartbeat);

      ws.on('message', (data, isBinary) => {
        if (!isBinary) {
          const message = data.toString();
          this.onTextMessage(message, ws);
        }
      });
    });

    this.broadcast = this.broadcast.bind(this);
    this.broadcastOnlineCounter = this.broadcastOnlineCounter.bind(this);
    this.broadcastPixelBuffer = this.broadcastPixelBuffer.bind(this);
    this.ping = this.ping.bind(this);
    this.broadcastChatMessage = this.broadcastChatMessage.bind(this);

    socketEvents.on('broadcast', this.broadcast);
    socketEvents.on('onlineCounter', this.broadcastOnlineCounter);
    socketEvents.on('pixelUpdate', this.broadcastPixelBuffer);
    socketEvents.on('chatMessage', this.broadcastChatMessage);

    setInterval(this.ping, 45 * 1000);
  }

  broadcastChatMessage(
    name,
    msg,
    channelId,
    id,
    country,
    sendapi,
    ws = null,
  ) {
    if (!sendapi) return;

    const sendmsg = JSON.stringify(['msg', name, msg, country, channelId]);
    this.wss.clients.forEach((client) => {
      if (client !== ws
        && client.subChat
        && client.readyState === WebSocket.OPEN) {
        client.send(sendmsg);
      }
    });
  }

  broadcast(data, filter = null) {
    if (typeof data === 'string') {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          if (!filter || filter(ws)) {
            ws.send(data);
          }
        }
      });
    } else {
      const frame = WebSocket.Sender.frame(data, {
        readOnly: true,
        mask: false,
        rsv1: false,
        opcode: 2,
        fin: true,
      });
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          if (!filter || filter(ws)) {
            frame.forEach((buffer) => {
              try {
                // eslint-disable-next-line no-underscore-dangle
                ws._socket.write(buffer);
              } catch (error) {
                logger.error(`WebSocket broadcast error: ${error.message}`);
              }
            });
          }
        }
      });
    }
  }

  broadcastOnlineCounter(data) {
    this.broadcast(data, (client) => client.subOnline);
  }

  broadcastPixelBuffer(canvasId, chunkid, buffer) {
    // just canvas 0 for now
    if (canvasId !== 0 && canvasId !== '0') {
      return;
    }
    this.broadcast(buffer, (client) => client.subPxl);
  }

  async onTextMessage(message, ws) {
    try {
      const packet = JSON.parse(message);
      const command = packet[0];
      packet.shift();
      if (!command) {
        return;
      }
      if (command === 'sub') {
        const even = packet[0];
        if (even === 'chat') {
          ws.subChat = true;
        } else if (even === 'pxl') {
          ws.subPxl = true;
        } else if (even === 'online') {
          ws.subOnline = true;
        } else {
          logger.info(`APISocket wanted to sub to unexisting  ${command}`);
        }
        logger.info(`APISocket client subscribed to  ${command}`);
        return;
      }
      if (command === 'setpxl') {
        const [minecraftid, ip, x, y, clr] = packet;
        if (clr < 0 || clr > 32) return;
        // be aware that user null has no cd
        if (!minecraftid && !ip) {
          setPixelByCoords('0', clr, x, y);
          ws.send(JSON.stringify(['retpxl', null, null, true, 0, 0]));
        }
        // minecraftid support got removed
        return;
      }
      logger.info(`APISocket message  ${message}`);
      if (command === 'chat') {
        const [name, msg, country, channelId] = packet;
        /*
         * do not send message back up ws that sent it
         * TODO: user id should not be hardcoded,
         * consider it whenever this actually gets used and
         * becomes an issue.
         */
        socketEvents.broadcastChatMessage(
          name,
          msg,
          channelId,
          1,
          country,
          false,
        );
        this.broadcastChatMessage(
          name,
          msg,
          channelId,
          1,
          country,
          true,
          ws,
        );
        return;
      }
    } catch (err) {
      logger.error(`Got undecipherable api-ws message ${message}`);
    }
  }

  ping() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping(() => {});
      return null;
    });
  }
}

export default APISocketServer;
