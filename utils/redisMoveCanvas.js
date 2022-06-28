// this script moves chunks of a canvas, i.e. to center it after changing size

import { createClient } from 'redis';

//ATTENTION Make suer to set the rdis URLs right!!!
const url = "redis://localhost:6379";
const redisc = createClient({ url });

const CANVAS_SIZE = 1024;
const TILE_SIZE = 256;
const offset = (2048 - 1024) / 2 / 256;

const CHUNKS_XY = CANVAS_SIZE / TILE_SIZE;

async function move() {
  for (let x = CHUNKS_XY - 1; x >= 0; x--) {
    for (let y = CHUNKS_XY - 1; y >= 0; y--) {
      const key = `ch:8:${x}:${y}`;
      const chunk = await redisc.get(key, { returnBuffers: true });
      if (chunk) {
        const newKey = `ch:8:${x + offset}:${y + offset}`
        await redisc.set(newKey, chunk);
        await redisc.del(key);
        console.log('Moved Chunk ', key, ' to ', newKey);
      }
    }
  }
  console.log("done");
}

redisc.connect()
  .then(() => move());
