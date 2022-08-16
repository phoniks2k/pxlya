/*
 * main websocket server
 */
import WebSocket from 'ws';

import logger from '../core/logger';
import canvases from '../core/canvases';
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
import authenticateClient from './authenticateClient';
import { drawByOffsets } from '../core/draw';
import { needCaptcha } from '../data/redis/captcha';
import isIPAllowed from '../core/isAllowed';


const ipCounter = new Counter();
// key: ip: string
// value: [rlTimestamp, triggered]
const rateLimit = new Map();

setInterval(() => {
  // clean old ratelimiter data
  const now = Date.now();
  const ips = [...rateLimit.keys()];
  for (let i = 0; i < ips.length; i += 1) {
    const ip = ips[i];
    const limiter = rateLimit.get(ip);
    if (limiter && now > limiter[0]) {
      rateLimit.delete(ip);
    }
  }
}, 30 * 1000);


class SocketServer {
  // WebSocket.Server
  wss;
  // Map<number, Array>
  CHUNK_CLIENTS;

  constructor() {
    this.CHUNK_CLIENTS = new Map();

    this.verifyClient = this.verifyClient.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.broadcastPixelBuffer = this.broadcastPixelBuffer.bind(this);
    this.reloadUser = this.reloadUser.bind(this);
    this.onlineCounterBroadcast = this.onlineCounterBroadcast.bind(this);
    this.checkHealth = this.checkHealth.bind(this);
  }

  initialize() {
    logger.info('Starting websocket server');

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      clientTracking: true,
      maxPayload: 65536,
      // path: "/ws",
      // server,
      noServer: true,
      verifyClient: this.verifyClient,
    });
    this.wss = wss;

    wss.on('error', (e) => {
      logger.error(`WebSocket Server Error ${e.message}`);
    });

    wss.on('connection', async (ws, req) => {
      ws.timeLastMsg = Date.now();
      ws.canvasId = null;
      const user = await authenticateClient(req);
      if (!user) {
        ws.close();
        return;
      }
      ws.user = user;
      ws.chunkCnt = 0;
      ws.name = user.getName();

      const { ip } = user;
      isIPAllowed(ip);

      ws.send(OnlineCounter.dehydrate(socketEvents.onlineCounter));

      ws.on('error', (e) => {
        logger.error(`WebSocket Client Error for ${ws.name}: ${e.message}`);
      });

      ws.on('close', () => {
        ipCounter.delete(ip);
        this.deleteAllChunks(ws);
      });

      ws.on('message', (data, isBinary) => {
        ws.timeLastMsg = Date.now();
        if (isBinary) {
          this.onBinaryMessage(data, ws);
        } else {
          const message = data.toString();
          this.onTextMessage(message, ws);
        }
      });
    });

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
      const clientArray = [];
      this.wss.clients.forEach((ws) => {
        if (ws.user && chatProvider.userHasChannelAccess(ws.user, channelId)) {
          clientArray.push(ws);
        }
      });
      SocketServer.broadcastSelected(clientArray, text);
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
    setInterval(this.checkHealth, 15 * 1000);
  }

  verifyClient(info, done) {
    const { req } = info;
    const { headers } = req;

    // Limiting socket connections per ip
    const ip = getIPFromRequest(req);
    // ratelimited
    const now = Date.now();
    const limiter = rateLimit.get(ip);
    if (limiter && limiter[1]) {
      if (limiter[0] > now) {
        // logger.info(`Rejected Socket-RateLimited Client ${ip}.`);
        return done(false);
      }
      limiter[1] = false;
      logger.info(`Allow Socket-RateLimited Client ${ip} again.`);
    }
    // CORS
    const { origin } = headers;
    if (!origin || !origin.endsWith(getHostFromRequest(req, false))) {
      // eslint-disable-next-line max-len
      logger.info(`Rejected CORS request on websocket from ${ip} via ${headers.origin}, expected ${getHostFromRequest(req, false)}`);
      return done(false);
    }
    if (ipCounter.get(ip) > 50) {
      rateLimit.set(ip, [now + 1000 * 60 * 15, true]);
      const amount = this.killAllWsByUerIp(ip);
      logger.info(
        `Client ${ip} has more than 50 connections open, killed ${amount}.`,
      );
      return done(false);
    }

    ipCounter.add(ip);
    return done(true);
  }

  /**
   * https://github.com/websockets/ws/issues/617
   * @param data
   */
  static broadcastSelected(clients, data) {
    let frames;

    if (typeof data === 'string') {
      frames = WebSocket.Sender.frame(Buffer.from(data), {
        readOnly: false,
        mask: false,
        rsv1: false,
        opcode: 1,
        fin: true,
      });
    } else {
      frames = WebSocket.Sender.frame(data, {
        readOnly: false,
        mask: false,
        rsv1: false,
        opcode: 2,
        fin: true,
      });
    }

    return clients.map((ws) => new Promise((resolve) => {
      if (ws.readyState === WebSocket.OPEN) {
        // eslint-disable-next-line no-underscore-dangle
        ws._sender.sendFrame(frames, (err) => {
          if (err) {
            logger.error(
              // eslint-disable-next-line max-len
              `WebSocket broadcast error on ${ws.user && ws.user.ip} : ${err.message}`,
            );
          }
        });
      }
      resolve();
    }));
  }

  broadcast(data) {
    const clientArray = [];
    this.wss.clients.forEach((ws) => {
      clientArray.push(ws);
    });
    SocketServer.broadcastSelected(clientArray, data);
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
      if (ws.readyState === WebSocket.OPEN
        && ws.user
        && ws.user.id === userId
      ) {
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
      if (ws.readyState === WebSocket.OPEN
        && ws.user
        && ws.user.id === userId
      ) {
        clients.push(ws);
      }
      client = it.next();
    }
    return clients;
  }

  killAllWsByUerIp(ip) {
    const it = this.wss.clients.keys();
    let amount = 0;
    let client = it.next();
    while (!client.done) {
      const ws = client.value;
      if (ws.readyState === WebSocket.OPEN
        && ws.user
        && ws.user.ip === ip
      ) {
        ws.terminate();
        amount += 1;
      }
      client = it.next();
    }
    return amount;
  }

  broadcastPixelBuffer(canvasId, chunkid, data) {
    if (this.CHUNK_CLIENTS.has(chunkid)) {
      const clients = this.CHUNK_CLIENTS.get(chunkid)
        // eslint-disable-next-line eqeqeq
        .filter((ws) => ws.canvasId == canvasId);
      SocketServer.broadcastSelected(clients, data);
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

  checkHealth() {
    const ts = Date.now() - 120 * 1000;
    const promises = [];
    this.wss.clients.forEach((ws) => {
      promises.push(new Promise((resolve) => {
        if (
          ws.readyState === WebSocket.OPEN
          && ts > ws.timeLastMsg
        ) {
          logger.info(`Killing dead websocket from ${ws.user.ip}`);
          ws.terminate();
          resolve();
        }
      }),
      );
    });
    return promises;
  }

  onlineCounterBroadcast() {
    try {
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
    } catch (err) {
      logger.error(`WebSocket online broadcast error: ${err.message}`);
    }
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
          const { ip } = user;

          const limiter = rateLimit.get(ip);
          if (limiter) {
            if (limiter[0] > Date.now() + 60000) {
              limiter[1] = true;
              limiter[0] += 1000 * 60 * 15;
              logger.warn(`Client ${ip} triggered Socket-RateLimit.`);
            }
            if (limiter[1]) {
              ws.terminate();
              return;
            }
          }

          if (canvasId === null) {
            logger.info(`Closing websocket without canvas from ${ip}`);
            ws.close();
            return;
          }

          let failureRet = null;
          // check if captcha needed
          if (await needCaptcha(ip)) {
            // need captcha
            failureRet = PixelReturn.dehydrate(10);
          } else {
            // (re)check for Proxy
            const allowed = await isIPAllowed(ip);
            if (!allowed.allowed) {
              // proxy
              let failureStatus = 11;
              if (allowed.status === 2) {
                // banned
                failureStatus = 14;
              } else if (allowed.status === 3) {
                // range banned
                failureStatus = 15;
              }
              failureRet = PixelReturn.dehydrate(failureStatus);
            }
          }
          if (failureRet !== null) {
            const now = Date.now();
            if (limiter && limiter[0] > now) {
              limiter[0] += 1000;
            } else {
              rateLimit.set(ip, [now + 1000, false]);
            }
            ws.send(failureRet);
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
            rankedPxlCnt,
            retCode,
          } = await drawByOffsets(
            ws.user,
            ws.canvasId,
            i, j,
            pixels,
          );
          ws.send(PixelReturn.dehydrate(
            retCode,
            wait,
            coolDown,
            pxlCnt,
            rankedPxlCnt,
          ));
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
    ws.chunkCnt += 1;
    if (ws.chunkCnt === 25000) {
      logger.info(
        `Client ${ws.user.ip} subscribed to 25k chunks`,
      );
    }
    if (!this.CHUNK_CLIENTS.has(chunkid)) {
      this.CHUNK_CLIENTS.set(chunkid, []);
    }
    const clients = this.CHUNK_CLIENTS.get(chunkid);
    const pos = clients.indexOf(ws);
    if (~pos) return;
    clients.push(ws);
  }

  deleteChunk(chunkid, ws) {
    ws.chunkCnt -= 1;
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
