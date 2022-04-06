/* @flow */


import WebSocket from 'ws';

import logger from '../core/logger';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';
import Counter from '../utils/Counter';
import { getIPFromRequest, getHostFromRequest } from '../utils/ip';

import CoolDownPacket from './packets/CoolDownPacket';
import PixelUpdate from './packets/PixelUpdateServer';
import PixelReturn from './packets/PixelReturn';
import RegisterCanvas from './packets/RegisterCanvas';
import RegisterChunk from './packets/RegisterChunk';
import RegisterMultipleChunks from './packets/RegisterMultipleChunks';
import DeRegisterChunk from './packets/DeRegisterChunk';
import DeRegisterMultipleChunks from './packets/DeRegisterMultipleChunks';
import ChangedMe from './packets/ChangedMe';
import OnlineCounter from './packets/OnlineCounter';

import socketEvents from './SocketEvents';
import chatProvider, { ChatProvider } from '../core/ChatProvider';
import authenticateClient from './verifyClient';
import { drawByOffsets } from '../core/draw';
import { needCaptcha } from '../utils/captcha';
import { cheapDetector } from '../core/isProxy';


const ipCounter: Counter<string> = new Counter();

function heartbeat() {
  this.isAlive = true;
}

async function verifyClient(info, done) {
  const { req } = info;
  const { headers } = req;

  // Limiting socket connections per ip
  const ip = getIPFromRequest(req);
  // CORS
  const { origin } = headers;
  if (!origin || !origin.endsWith(getHostFromRequest(req, false))) {
    // eslint-disable-next-line max-len
    logger.info(`Rejected CORS request on websocket from ${ip} via ${headers.origin}, expected ${getHostFromRequest(req, false)}`);
    return done(false);
  }
  if (ipCounter.get(ip) > 50) {
    logger.info(`Client ${ip} has more than 50 connections open.`);
    return done(false);
  }

  ipCounter.add(ip);
  return done(true);
}


class SocketServer {
  wss: WebSocket.Server;
  CHUNK_CLIENTS: Map<number, Array>;

  initialize() {
    this.CHUNK_CLIENTS = new Map();
    logger.info('Starting websocket server');

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      clientTracking: true,
      maxPayload: 65536,
      // path: "/ws",
      // server,
      noServer: true,
      verifyClient,
    });
    this.wss = wss;

    wss.on('error', (e) => {
      logger.error(`WebSocket Server Error ${e.message}`);
    });

    wss.on('connection', async (ws, req) => {
      ws.isAlive = true;
      ws.canvasId = null;
      ws.startDate = Date.now();
      const user = await authenticateClient(req);
      if (!user) {
        ws.close();
        return;
      }
      ws.user = user;
      ws.name = user.getName();
      cheapDetector(user.ip);

      ws.send(OnlineCounter.dehydrate(socketEvents.onlineCounter));

      ws.on('error', (e) => {
        logger.error(`WebSocket Client Error for ${ws.name}: ${e.message}`);
      });

      ws.on('pong', heartbeat);

      ws.on('close', () => {
        ipCounter.delete(getIPFromRequest(req));
        this.deleteAllChunks(ws);
      });

      ws.on('message', (data, isBinary) => {
        if (isBinary) {
          this.onBinaryMessage(data, ws);
        } else {
          const message = data.toString();
          this.onTextMessage(message, ws);
        }
      });
    });

    this.broadcast = this.broadcast.bind(this);
    this.broadcastPixelBuffer = this.broadcastPixelBuffer.bind(this);
    this.reloadUser = this.reloadUser.bind(this);
    this.ping = this.ping.bind(this);
    this.onlineCounterBroadcast = this.onlineCounterBroadcast.bind(this);

    socketEvents.on('broadcast', this.broadcast);
    socketEvents.on('onlineCounter', this.broadcast);
    socketEvents.on('pixelUpdate', this.broadcastPixelBuffer);
    socketEvents.on('reloadUser', this.reloadUser);

    socketEvents.on('suChatMessage', (
      userId,
      name,
      message,
      channelId,
      id,
      country,
    ) => {
      this.findAllWsByUerId(userId).forEach((ws) => {
        const text = JSON.stringify([name, message, country, channelId, id]);
        ws.send(text);
      });
    });

    socketEvents.on('chatMessage', (
      name,
      message,
      channelId,
      id,
      country,
    ) => {
      const text = JSON.stringify([name, message, country, channelId, id]);
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN && ws.user) {
          if (chatProvider.userHasChannelAccess(ws.user, channelId)) {
            ws.send(text);
          }
        }
      });
    });

    socketEvents.on('addChatChannel', (userId, channelId, channelArray) => {
      this.findAllWsByUerId(userId).forEach((ws) => {
        ws.user.addChannel(channelId, channelArray);
        const text = JSON.stringify([
          'addch', {
            [channelId]: channelArray,
          },
        ]);
        ws.send(text);
      });
    });

    socketEvents.on('remChatChannel', (userId, channelId) => {
      this.findAllWsByUerId(userId).forEach((ws) => {
        ws.user.removeChannel(channelId);
        const text = JSON.stringify(['remch', channelId]);
        ws.send(text);
      });
    });

    setInterval(this.onlineCounterBroadcast, 10 * 1000);
    setInterval(this.ping, 15 * 1000);
  }


  /**
   * https://github.com/websockets/ws/issues/617
   * @param data
   */
  broadcast(data) {
    if (typeof data === 'string') {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
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
          frame.forEach((buffer) => {
            try {
              // eslint-disable-next-line no-underscore-dangle
              ws._socket.write(buffer);
            } catch (error) {
              logger.error(`WebSocket broadcast error: ${error.message}`);
            }
          });
        }
      });
    }
  }

  /*
   * keep in mind that a user could
   * be connected from multiple devices
   */
  findWsByUserId(userId) {
    const it = this.wss.clients.keys();
    let client = it.next();
    while (!client.done) {
      const ws = client.value;
      if (ws.user.id === userId && ws.readyState === WebSocket.OPEN) {
        return ws;
      }
      client = it.next();
    }
    return null;
  }

  findAllWsByUerId(userId) {
    const clients = [];
    const it = this.wss.clients.keys();
    let client = it.next();
    while (!client.done) {
      const ws = client.value;
      if (ws.user.id === userId && ws.readyState === WebSocket.OPEN) {
        clients.push(ws);
      }
      client = it.next();
    }
    return clients;
  }

  broadcastPixelBuffer(canvasId: number, chunkid, data: Buffer) {
    const frame = WebSocket.Sender.frame(data, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    if (this.CHUNK_CLIENTS.has(chunkid)) {
      const clients = this.CHUNK_CLIENTS.get(chunkid);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN
          // canvasId can be number or string, caused by
          // js disctionaries not being able to have numbers as keys
          // eslint-disable-next-line eqeqeq
          && client.canvasId == canvasId
        ) {
          frame.forEach((buffer) => {
            try {
              // eslint-disable-next-line no-underscore-dangle
              client._socket.write(buffer);
            } catch (error) {
              logger.error(
                `WebSocket broadcast pixelbuffer error: ${error.message}`,
              );
            }
          });
        }
      });
    }
  }

  reloadUser(name) {
    this.wss.clients.forEach(async (ws) => {
      if (ws.name === name) {
        await ws.user.reload();
        ws.name = ws.user.getName();
        const buffer = ChangedMe.dehydrate();
        ws.send(buffer);
      }
    });
  }

  ping() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        logger.info(`Killing dead websocket from ${ws.user.ip}`);
        ws.terminate();
      } else {
        ws.isAlive = false;
        ws.ping(() => {});
      }
    });
  }

  onlineCounterBroadcast() {
    const online = {};
    online.total = ipCounter.amount() || 0;
    const ipsPerCanvas = {};
    const it = this.wss.clients.keys();
    let client = it.next();
    while (!client.done) {
      const ws = client.value;
      if (ws.readyState === WebSocket.OPEN
        && ws.user
      ) {
        const canvasId = ws.canvasId || 0;
        const { ip } = ws.user;
        // only count unique IPs per canvas
        if (!ipsPerCanvas[canvasId]) {
          ipsPerCanvas[canvasId] = [ip];
        } else if (ipsPerCanvas[canvasId].includes(ip)) {
          client = it.next();
          continue;
        } else {
          ipsPerCanvas[canvasId].push(ip);
        }
        //--
        if (!online[canvasId]) {
          online[canvasId] = 0;
        }
        online[canvasId] += 1;
      }
      client = it.next();
    }
    socketEvents.broadcastOnlineCounter(online);
  }

  async onTextMessage(text, ws) {
    /*
     * all client -> server text messages are
     * chat messages in [message, channelId] format
     */
    try {
      let message;
      let channelId;
      try {
        const data = JSON.parse(text);
        [message, channelId] = data;
        channelId = Number(channelId);
        if (Number.isNaN(channelId)) {
          throw new Error('NaN');
        }
      } catch {
        logger.warn(
          `Received unparseable message from ${ws.name} on websocket: ${text}`,
        );
        return;
      }
      message = message.trim();

      /*
       * just if logged in
       */
      if (ws.name && message) {
        const { user } = ws;
        /*
         * if DM channel, make sure that other user has DM open
         * (needed because we allow user to leave one-sided
         *  and auto-join on message)
         *  TODO: if we scale and have multiple websocket servers at some point
         *  this might be an issue. We would hve to make a shared list of online
         *  users and act based on that on 'chatMessage' event
         */
        const dmUserId = chatProvider.checkIfDm(user, channelId);
        if (dmUserId) {
          const dmWs = this.findWsByUserId(dmUserId);
          if (!dmWs
            || !chatProvider.userHasChannelAccess(dmWs.user, channelId)
          ) {
            await ChatProvider.addUserToChannel(
              dmUserId,
              channelId,
              [ws.name, 1, Date.now(), user.id],
            );
          }
        }

        /*
         * send chat message
         */
        socketEvents.recvChatMessage(user, message, channelId);
      } else {
        logger.info('Got empty message or message from unidentified ws');
      }
    } catch (error) {
      logger.error('Got invalid ws text message');
      logger.error(error.message);
      logger.error(error.stack);
    }
  }

  async onBinaryMessage(buffer, ws) {
    if (buffer.byteLength === 0) return;
    const opcode = buffer[0];

    try {
      switch (opcode) {
        case PixelUpdate.OP_CODE: {
          const { canvasId, user } = ws;
          if (canvasId === null) {
            return;
          }
          const { ip } = user;
          // check if captcha needed
          if (await needCaptcha(ip)) {
            // need captcha
            ws.send(PixelReturn.dehydrate(10, 0, 0));
            break;
          }
          // (re)check for Proxy
          if (await cheapDetector(ip)) {
            ws.send(PixelReturn.dehydrate(11, 0, 0));
            break;
          }
          // receive pixels here
          const {
            i, j, pixels,
          } = PixelUpdate.hydrate(buffer);
          const {
            wait,
            coolDown,
            pxlCnt,
            retCode,
          } = await drawByOffsets(
            ws.user,
            ws.canvasId,
            i, j,
            pixels,
          );
          ws.send(PixelReturn.dehydrate(retCode, wait, coolDown, pxlCnt));
          break;
        }
        case RegisterCanvas.OP_CODE: {
          const canvasId = RegisterCanvas.hydrate(buffer);
          if (!canvases[canvasId]) return;
          if (ws.canvasId !== null && ws.canvasId !== canvasId) {
            this.deleteAllChunks(ws);
          }
          ws.canvasId = canvasId;
          const wait = await ws.user.getWait(canvasId);
          ws.send(CoolDownPacket.dehydrate(wait));
          break;
        }
        case RegisterChunk.OP_CODE: {
          const chunkid = RegisterChunk.hydrate(buffer);
          this.pushChunk(chunkid, ws);
          break;
        }
        case RegisterMultipleChunks.OP_CODE: {
          this.deleteAllChunks(ws);
          let posu = 2;
          while (posu < buffer.length) {
            const chunkid = buffer[posu++] | buffer[posu++] << 8;
            this.pushChunk(chunkid, ws);
          }
          break;
        }
        case DeRegisterChunk.OP_CODE: {
          const chunkidn = DeRegisterChunk.hydrate(buffer);
          this.deleteChunk(chunkidn, ws);
          break;
        }
        case DeRegisterMultipleChunks.OP_CODE: {
          let posl = 2;
          while (posl < buffer.length) {
            const chunkid = buffer[posl++] | buffer[posl++] << 8;
            this.deleteChunk(chunkid, ws);
          }
          break;
        }
        default:
          break;
      }
    } catch (e) {
      logger.info('Got invalid ws binary message');
      throw e;
    }
  }

  pushChunk(chunkid, ws) {
    if (!this.CHUNK_CLIENTS.has(chunkid)) {
      this.CHUNK_CLIENTS.set(chunkid, []);
    }
    const clients = this.CHUNK_CLIENTS.get(chunkid);
    const pos = clients.indexOf(ws);
    if (~pos) return;
    clients.push(ws);
  }

  deleteChunk(chunkid, ws) {
    if (!this.CHUNK_CLIENTS.has(chunkid)) return;
    const clients = this.CHUNK_CLIENTS.get(chunkid);
    const pos = clients.indexOf(ws);
    if (~pos) clients.splice(pos, 1);
  }

  deleteAllChunks(ws) {
    this.CHUNK_CLIENTS.forEach((client) => {
      if (!client) return;
      const pos = client.indexOf(ws);
      if (~pos) client.splice(pos, 1);
    });
  }
}

export default SocketServer;
