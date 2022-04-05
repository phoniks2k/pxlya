/*
 * upload image to canvs in console
 * doesn't care about previous data
 * no checks - don't use if you can use Admintools
 */

import redis from 'redis';
import sharp from 'sharp';

import canvases from '../src/canvases.json';
import Palette from '../src/core/Palette';
import {
  getChunkOfPixel,
} from '../src/core/utils';
import {
  TILE_SIZE,
} from '../src/core/constants';

//ATTENTION Make suer to set the rdis URLs right!!!
const redisurl = "redis://localhost:6379";
const redisCanvas = redis.createClient(redisurl, { return_buffers: true });

/*
 * copied and modified from src/core/Image.js
 */
async function imageABGR2Canvas(
  canvasId: number,
  x: number,
  y: number,
  data: Buffer,
  width: number,
  height: number,
) {
  console.log(
    `Loading image with dim ${width}/${height} to ${x}/${y}/${canvasId}`,
  );
  const canvas = canvases[canvasId];
  const { colors, cli, size } = canvas;
  const palette = new Palette(colors);
  const canvasMinXY = -(size / 2);
  const imageData = new Uint32Array(data.buffer);

  const [ucx, ucy] = getChunkOfPixel(size, x, y);
  const [lcx, lcy] = getChunkOfPixel(size, x + width, y + height);

  let totalPxlCnt = 0;
  console.log(`Loading to chunks from ${ucx} / ${ucy} to ${lcx} / ${lcy} ...`);
  let chunk;
  for (let cx = ucx; cx <= lcx; cx += 1) {
    for (let cy = ucy; cy <= lcy; cy += 1) {
      chunk = new Uint8Array(TILE_SIZE * TILE_SIZE);
      // offset of chunk in image
      const cOffX = cx * TILE_SIZE + canvasMinXY - x;
      const cOffY = cy * TILE_SIZE + canvasMinXY - y;
      let cOff = 0;
      let pxlCnt = 0;
      for (let py = 0; py < TILE_SIZE; py += 1) {
        for (let px = 0; px < TILE_SIZE; px += 1) {
          const clrX = cOffX + px;
          const clrY = cOffY + py;
          if (clrX >= 0 && clrY >= 0 && clrX < width && clrY < height) {
            const clr = imageData[clrX + clrY * width];
            const clrIndex = palette.abgr.indexOf(clr);
            if (clrIndex !== -1) {
              chunk[cOff] = clrIndex;
              pxlCnt += 1;
            }
          }
          cOff += 1;
        }
      }
      if (pxlCnt) {
        const key = `ch:${canvasId}:${cx}:${cy}`;
        await redisCanvas.set(key, Buffer.from(chunk.buffer));
        console.log(`Loaded ${pxlCnt} pixels into chunk ${cx}, ${cy}.`);
        totalPxlCnt += pxlCnt;
      }
      chunk = null;
    }
  }
  console.log('Image loading done.');
  return totalPxlCnt;
}


async function uploadImage(
  path,
  canvasId,
  x,
  y,
) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pxlCount = await imageABGR2Canvas(
    canvasId,
    x, y,
    data,
    info.width, info.height,
  );
}

uploadImage('PZ.png', '5', -4096, -4096);
//uploadImage('PC.png', '6', -7000, -7000)
