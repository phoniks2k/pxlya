
// allow the websocket to be noisy on the console
/* eslint-disable no-console */

import EventEmitter from 'events';

import CoolDownPacket from './packets/CoolDownPacket';
import PixelUpdate from './packets/PixelUpdateClient';
import PixelReturn from './packets/PixelReturn';
import OnlineCounter from './packets/OnlineCounter';
import RegisterCanvas from './packets/RegisterCanvas';
import RegisterChunk from './packets/RegisterChunk';
import RegisterMultipleChunks from './packets/RegisterMultipleChunks';
import DeRegisterChunk from './packets/DeRegisterChunk';
import ChangedMe from './packets/ChangedMe';
import Ping from './packets/Ping';

const chunks = [];

class SocketClient extends EventEmitter {
  constructor() {
    super();
    console.log('Creating WebSocketClient');
    this.ws = null;
    this.canvasId = 0;
    this.channelId = 0;
    /*
     * properties set in connect and open:
     * this.timeLastConnecting
     * this.timeLastPing
     * this.timeLastSent
     */
    this.readyState = WebSocket.CLOSED;
    this.msgQueue = [];

    this.checkHealth = this.checkHealth.bind(this);
    setInterval(this.checkHealth, 2000);
  }

  async connect() {
    this.readyState = WebSocket.CONNECTING;
    if (this.ws) {
      console.log('WebSocket already open, not starting');
    }
    this.timeLastConnecting = Date.now();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.hostname}${
      window.location.port ? `:${window.location.port}` : ''
    }/ws`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = (err) => {
      console.error('Socket encountered error, closing socket', err);
    };
  }

  checkHealth() {
    if (this.readyState === WebSocket.OPEN) {
      const now = Date.now();
      if (now - 30000 > this.timeLastPing) {
        // server didn't send anything, probably dead
        console.log('Server is silent, killing websocket');
        this.readyState = WebSocket.CLOSING;
        this.ws.close();
      }
      if (now - 23000 > this.timeLastSent) {
        // make sure we send something at least all 25s
        this.send(Ping.dehydrate());
        this.timeLastSent = now;
      }
    }
  }

  sendWhenReady(msg) {
    /*
     * if websocket is closed, store messages and send
     * them later, once connection is established again.
     * Do NOT use this method for things that wouldn't be useful after reconnect
     */
    this.timeLastSent = Date.now();
    if (this.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      console.log('Tried sending message when websocket was closed!');
      this.msgQueue.push(msg);
    }
  }

  send(msg) {
    if (this.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    }
  }

  processMsgQueue() {
    while (this.msgQueue.length > 0) {
      this.sendWhenReady(this.msgQueue.shift());
    }
  }

  onOpen() {
    const now = Date.now();
    this.timeLastPing = now;
    this.timeLastSent = now;

    this.emit('open', {});
    this.readyState = WebSocket.OPEN;
    this.send(RegisterCanvas.dehydrate(this.canvasId));
    console.log(`Register ${chunks.length} chunks`);
    this.send(RegisterMultipleChunks.dehydrate(chunks));
    this.processMsgQueue();
  }

  setCanvas(canvasId) {
    /* canvasId can be string or integer, thanks to
     * JSON not allowing integer keys
     */
    // eslint-disable-next-line eqeqeq
    if (this.canvasId == canvasId || canvasId === null) {
      return;
    }
    console.log('Notify websocket server that we changed canvas');
    this.canvasId = canvasId;
    chunks.length = 0;
    this.send(RegisterCanvas.dehydrate(this.canvasId));
  }

  registerChunk(cell) {
    const [i, j] = cell;
    const chunkid = (i << 8) | j;
    chunks.push(chunkid);
    const buffer = RegisterChunk.dehydrate(chunkid);
    if (this.readyState === WebSocket.OPEN) {
      this.send(buffer);
    }
  }

  deRegisterChunk(cell) {
    const [i, j] = cell;
    const chunkid = (i << 8) | j;
    const buffer = DeRegisterChunk.dehydrate(chunkid);
    if (this.readyState === WebSocket.OPEN) {
      this.send(buffer);
    }
    const pos = chunks.indexOf(chunkid);
    if (~pos) chunks.splice(pos, 1);
  }

  /*
   * Send pixel request
   * @param i, j chunk coordinates
   * @param pixel Array of [[offset, color],...]  pixels within chunk
   */
  requestPlacePixels(
    i, j,
    pixels,
  ) {
    const buffer = PixelUpdate.dehydrate(i, j, pixels);
    this.sendWhenReady(buffer);
  }

  sendChatMessage(message, channelId) {
    this.sendWhenReady(JSON.stringify([message, channelId]));
  }

  onMessage({ data: message }) {
    try {
      if (typeof message === 'string') {
        this.onTextMessage(message);
      } else {
        this.onBinaryMessage(message);
      }
    } catch (err) {
      console.log(
        `An error occured while parsing websocket message ${message}`,
        err,
      );
    }
  }

  onTextMessage(message) {
    if (!message) return;
    const data = JSON.parse(message);

    if (Array.isArray(data)) {
      switch (data.length) {
        case 5: {
          // chat message
          const [name, text, country, channelId, userId] = data;
          this.emit('chatMessage',
            name, text, country, Number(channelId), userId);
          return;
        }

        case 2: {
          // signal
          const [signal, args] = data;
          this.emit(signal, args);
          break;
        }
        default:
          // nothing
      }
    }
  }

  onBinaryMessage(buffer) {
    if (buffer.byteLength === 0) return;
    const data = new DataView(buffer);
    const opcode = data.getUint8(0);

    this.timeLastPing = Date.now();

    switch (opcode) {
      case PixelUpdate.OP_CODE:
        this.emit('pixelUpdate', PixelUpdate.hydrate(data));
        break;
      case PixelReturn.OP_CODE:
        this.emit('pixelReturn', PixelReturn.hydrate(data));
        break;
      case OnlineCounter.OP_CODE:
        this.emit('onlineCounter', OnlineCounter.hydrate(data));
        break;
      case CoolDownPacket.OP_CODE:
        this.emit('cooldownPacket', CoolDownPacket.hydrate(data));
        break;
      case ChangedMe.OP_CODE:
        console.log('Websocket requested api/me reload');
        this.emit('changedMe');
        this.reconnect();
        break;
      default:
        console.error(`Unknown op_code ${opcode} received`);
        break;
    }
  }

  onClose(e) {
    this.emit('close');
    this.ws = null;
    this.readyState = WebSocket.CONNECTING;
    // reconnect in 1s if last connect was longer than 7s ago, else 5s
    const timeout = this.timeLastConnecting < Date.now() - 7000 ? 1000 : 5000;
    console.warn(
      `Socket is closed. Reconnect will be attempted in ${timeout} ms.`,
      e.reason,
    );
    setTimeout(() => this.connect(), timeout);
  }

  reconnect() {
    if (this.readyState === WebSocket.OPEN) {
      this.readyState = WebSocket.CLOSING;
      console.log('Restarting WebSocket');
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
      this.connect();
    }
  }
}

export default new SocketClient();
