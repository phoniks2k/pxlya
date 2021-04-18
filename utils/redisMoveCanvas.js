/* @flow */
// this script moves chunks of a canvas, i.e. to center it after changing size

import redis from 'redis';
import bluebird from 'bluebird';


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//ATTENTION Make suer to set the rdis URLs right!!!
const url = "redis://localhost:6379";
const redisc = redis.createClient(url, { return_buffers: true });

const CANVAS_SIZE = 4096;
const TILE_SIZE = 256;
const offset = (16384 - 4096) / 2 / 256;

const CHUNKS_XY = CANVAS_SIZE / TILE_SIZE;

async function move() {
  for (let x = CHUNKS_XY - 1; x >= 0; x--) {
    for (let y = CHUNKS_XY - 1; y >= 0; y--) {
      const key = `ch:1:${x}:${y}`;
      const chunk = await redisc.getAsync(key);
      if (chunk) {
        const buffer = new Uint8Array(chunk);
        const newKey = `ch:1:${x + offset}:${y + offset}`
        await redisc.setAsync(newKey, Buffer.from(buffer.buffer));
        await redisc.delAsync(key);
        console.log('Moved Chunk ', key, ' to ', newKey);
      }
    }
  }
  console.log("done");
}

move();
