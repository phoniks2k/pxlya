/*
 * sends messages to other ppfun instances
 * to work as cluster
 */

/* eslint-disable no-console */

import { SHARD_NAME } from '../core/config';
import SocketEvents from './SockEvents';
import OnlineCounter from './packets/OnlineCounter';
import PixelUpdate from './packets/PixelUpdateServer';
import PixelUpdateMB from './packets/PixelUpdateMB';
import ChunkUpdate from './packets/ChunkUpdate';
import { pubsub } from '../data/redis/client';


class MessageBroker extends SocketEvents {
  constructor() {
    super();
    this.isCluster = true;
    this.thisShard = SHARD_NAME;
    /*
     * all other shards
     */
    this.shards = {};
    /*
     * online counter of all shards including ourself
     */
    this.shardOnlineCounters = [];
    this.publisher = {
      publish: () => {},
    };
    this.subscriber = {
      subscribe: () => {},
      unsubscribe: () => {},
    };
    this.checkHealth = this.checkHealth.bind(this);
    setInterval(this.checkHealth, 10000);
  }

  // TODO imprement shared storage that is run by main shard

  async initialize() {
    /*
     * broadcast channel for staus messages between shards
     */
    this.publisher = pubsub.publisher;
    this.subscriber = pubsub.subscriber;
    await this.subscriber.subscribe('bc', (...args) => {
      this.onShardBCMessage(...args);
    });
    // give other shards 30s to announce themselves
    await new Promise((resolve) => {
      setTimeout(resolve, 25000);
    });
    console.log('CLUSTER: Initialized message broker');
  }

  async onShardBCMessage(message) {
    try {
      /*
       * messages from own shard get dropped
       */
      if (!message || message.startsWith(this.thisShard)) {
        return;
      }
      const comma = message.indexOf(',');
      /*
       * any other package in the form of 'shard:type,JSONArrayData'
       * straight sent over websocket
       */
      if (~comma) {
        const key = message.slice(message.indexOf(':') + 1, comma);
        console.log('CLUSTER: Broadcast', key);
        const val = JSON.parse(message.slice(comma + 1));
        super.emit(key, ...val);
        return;
      }
      if (!this.shards[message]) {
        console.log(`CLUSTER: Shard ${message} connected`);
        this.shards[message] = Date.now();
        await this.subscriber.subscribe(
          message,
          (buffer) => this.onShardBinaryMessage(buffer, message),
          true,
        );
        // immediately give new shards informations
        this.publisher.publish('bc', this.thisShard);
        return;
      }
      this.shards[message] = Date.now();
      return;
    } catch (err) {
      console.error(`CLUSTER: Error on broadcast message: ${err.message}`);
    }
  }

  getLowestActiveShard() {
    let lowest = 0;
    let lShard = null;
    this.shardOnlineCounters.forEach((shardData) => {
      const [shard, cnt] = shardData;
      if (cnt.total < lowest || !lShard) {
        lShard = shard;
        lowest = cnt.total;
      }
    });
    return lShard || this.thisShard;
  }

  amIImportant() {
    /*
     * important main shard does tasks like running RpgEvent
     * or updating rankings
     */
    return !this.shardOnlineCounters[0]
      || this.shardOnlineCounters[0][0] === this.thisShard;
  }

  updateShardOnlineCounter(shard, cnt) {
    const shardCounter = this.shardOnlineCounters.find(
      (c) => c[0] === shard,
    );
    if (!shardCounter) {
      this.shardOnlineCounters.push([shard, cnt]);
      this.shardOnlineCounters.sort((a, b) => a[0].localeCompare(b[0]));
    } else {
      shardCounter[1] = cnt;
    }
    this.sumOnlineCounters();
  }

  onShardBinaryMessage(buffer, shard) {
    try {
      const opcode = buffer[0];
      switch (opcode) {
        case PixelUpdateMB.OP_CODE: {
          const puData = PixelUpdateMB.hydrate(buffer);
          super.emit('pixelUpdate', ...puData);
          const chunkId = puData[1];
          const chunk = [chunkId >> 8, chunkId & 0xFF];
          super.emit('chunkUpdate', puData[0], chunk);
          break;
        }
        case ChunkUpdate.OP_CODE: {
          super.emit('chunkUpdate', ...ChunkUpdate.hydrate(buffer));
          break;
        }
        case OnlineCounter.OP_CODE: {
          const data = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.length,
          );
          const cnt = OnlineCounter.hydrate(data);
          this.updateShardOnlineCounter(shard, cnt);
          break;
        }
        default:
          // nothing
      }
    } catch (err) {
      // eslint-disable-next-line max-len
      console.error(`CLUSTER: Error on binery message of shard ${shard}: ${err.message}`);
    }
  }

  sumOnlineCounters() {
    const newCounter = {};
    this.shardOnlineCounters.forEach((shardData) => {
      const [, cnt] = shardData;
      Object.keys(cnt).forEach((canv) => {
        const num = cnt[canv];
        if (newCounter[canv]) {
          newCounter[canv] += num;
        } else {
          newCounter[canv] = num;
        }
      });
    });
    this.onlineCounter = newCounter;
  }

  /*
   * intercept all events and distribute them to others
   */
  emit(key, ...args) {
    super.emit(key, ...args);
    if (key === 'recvChatMessage') {
      return;
    }
    const msg = `${this.thisShard}:${key},${JSON.stringify(args)}`;
    this.publisher.publish('bc', msg);
  }

  /*
   * broadcast pixel message via websocket
   * @param canvasId number ident of canvas
   * @param chunkid number id consisting of i,j chunk coordinates
   * @param pxls buffer with offset and color of one or more pixels
   */
  broadcastPixels(
    canvasId,
    chunkId,
    pixels,
  ) {
    const i = chunkId >> 8;
    const j = chunkId & 0xFF;
    this.publisher.publish(
      this.thisShard,
      PixelUpdateMB.dehydrate(canvasId, i, j, pixels),
    );
    const buffer = PixelUpdate.dehydrate(i, j, pixels);
    super.emit('pixelUpdate', canvasId, chunkId, buffer);
    super.emit('chunkUpdate', canvasId, [i, j]);
  }

  broadcastChunkUpdate(
    canvasId,
    chunk,
  ) {
    this.publisher.publish(
      this.thisShard,
      ChunkUpdate.dehydrate(canvasId, chunk),
    );
    super.emit('chunkUpdate', canvasId, chunk);
  }

  broadcastOnlineCounter(online) {
    this.updateShardOnlineCounter(this.thisShard, online);
    let buffer = OnlineCounter.dehydrate(online);
    // send our online counter to other shards
    this.publisher.publish(this.thisShard, buffer);
    // send total counter to our players
    buffer = OnlineCounter.dehydrate(this.onlineCounter);
    super.emit('onlineCounter', buffer);
  }

  checkHealth() {
    // remove disconnected shards
    const threshold = Date.now() - 30000;
    const { shards } = this;
    Object.keys(shards).forEach((shard) => {
      if (shards[shard] < threshold) {
        console.log(`CLUSTER: Shard ${shard} disconnected`);
        delete shards[shard];
        const counterIndex = this.shardOnlineCounters.findIndex(
          (c) => c[0] === shard,
        );
        if (~counterIndex) {
          this.shardOnlineCounters.splice(counterIndex, 1);
        }
        this.subscriber.unsubscribe(shard);
      }
    });
    // send keep alive to others
    this.publisher.publish('bc', this.thisShard);
  }
}

export default MessageBroker;
