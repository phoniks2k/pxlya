/*
 * canvas data on redis
 */
import { commandOptions } from 'redis';

import { getChunkOfPixel, getOffsetOfPixel } from '../../core/utils';
import {
  TILE_SIZE,
  THREE_TILE_SIZE,
  THREE_CANVAS_HEIGHT,
} from '../../core/constants';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';

import redis from '../redis';


const UINT_SIZE = 'u8';

const EMPTY_CACA = new Uint8Array(TILE_SIZE * TILE_SIZE);
const EMPTY_CHUNK_BUFFER = Buffer.from(EMPTY_CACA.buffer);
const THREE_EMPTY_CACA = new Uint8Array(
  THREE_TILE_SIZE * THREE_TILE_SIZE * THREE_CANVAS_HEIGHT,
);
const THREE_EMPTY_CHUNK_BUFFER = Buffer.from(THREE_EMPTY_CACA.buffer);

// cache existence of chunks
const chunks = new Set();


class RedisCanvas {
  // array of callback functions that gets informed about chunk changes
  static registerChunkChange = [];
  static setChunkChangeCallback(cb) {
    RedisCanvas.registerChunkChange.push(cb);
  }

  static execChunkChangeCallback(canvasId, cell) {
    for (let i = 0; i < RedisCanvas.registerChunkChange.length; i += 1) {
      RedisCanvas.registerChunkChange[i](canvasId, cell);
    }
  }

  static getChunk(
    canvasId,
    i,
    j,
  ) {
    // this key is also hardcoded into
    // core/tilesBackup.js
    // and ./EventData.js
    const key = `ch:${canvasId}:${i}:${j}`;
    return redis.get(
      commandOptions({ returnBuffers: true }),
      key,
    );
  }

  static async setChunk(i, j, chunk, canvasId) {
    if (chunk.length !== TILE_SIZE * TILE_SIZE) {
      // eslint-disable-next-line no-console
      console.error(
        new Error(`Tried to set chunk with invalid length ${chunk.length}!`),
      );
      return false;
    }
    const key = `ch:${canvasId}:${i}:${j}`;
    await redis.set(key, Buffer.from(chunk.buffer));
    RedisCanvas.execChunkChangeCallback(canvasId, [i, j]);
    return true;
  }

  static async delChunk(i, j, canvasId) {
    const key = `ch:${canvasId}:${i}:${j}`;
    await redis.del(key);
    chunks.delete(key);
    RedisCanvas.execChunkChangeCallback(canvasId, [i, j]);
    return true;
  }

  static async setPixel(
    canvasId,
    color,
    x,
    y,
    z = null,
  ) {
    const canvasSize = canvases[canvasId].size;
    const [i, j] = getChunkOfPixel(canvasSize, x, y, z);
    const offset = getOffsetOfPixel(canvasSize, x, y, z);
    RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  }

  multi = null;

  static enqueuePixel(
    canvasId,
    color,
    i,
    j,
    offset,
  ) {
    if (!RedisCanvas.multi) {
      RedisCanvas.multi = redis.multi();
    }
    RedisCanvas.multi.addCommand(
      [
        'BITFIELD',
        `ch:${canvasId}:${i}:${j}`,
        'SET',
        UINT_SIZE,
        `#${offset}`,
        color,
      ],
    );
    RedisCanvas.execChunkChangeCallback(canvasId, [i, j]);
  }

  static flushPixels() {
    if (RedisCanvas.multi) {
      const { multi } = RedisCanvas;
      RedisCanvas.multi = null;
      // true for execAsPipeline
      return multi.exec(true);
    }
    return null;
  }

  static async setPixelInChunk(
    i,
    j,
    offset,
    color,
    canvasId,
  ) {
    const key = `ch:${canvasId}:${i}:${j}`;

    if (!chunks.has(key)) {
      if (canvases[canvasId].v) {
        await redis.set(key, THREE_EMPTY_CHUNK_BUFFER, {
          NX: true,
        });
      } else {
        await redis.set(key, EMPTY_CHUNK_BUFFER, {
          NX: true,
        });
      }
      chunks.add(key);
    }

    const args = ['BITFIELD', key, 'SET', UINT_SIZE, `#${offset}`, color];
    await redis.sendCommand(args);
    RedisCanvas.execChunkChangeCallback(canvasId, [i, j]);
  }

  static async getPixelIfExists(
    canvasId,
    i,
    j,
    offset,
  ) {
    // 1st bit -> protected or not
    // 2nd bit -> unused
    // rest (6 bits) -> index of color
    const args = [
      'BITFIELD',
      `ch:${canvasId}:${i}:${j}`,
      'GET',
      UINT_SIZE,
      `#${offset}`,
    ];
    const result = await redis.sendCommand(args);
    if (!result) return null;
    const color = result[0];
    return color;
  }

  static async getPixelByOffset(
    canvasId,
    i,
    j,
    offset,
  ) {
    const clr = RedisCanvas.getPixelIfExists(canvasId, i, j, offset);
    return (clr == null) ? 0 : clr;
  }

  static async getPixel(
    canvasId,
    x,
    y,
    z = null,
  ) {
    const canvasSize = canvases[canvasId].size;
    const [i, j] = getChunkOfPixel(canvasSize, x, y, z);
    const offset = getOffsetOfPixel(canvasSize, x, y, z);

    const clr = RedisCanvas.getPixelIfExists(canvasId, i, j, offset);
    return (clr == null) ? 0 : clr;
  }
}

setInterval(RedisCanvas.flushPixels, 100);

export default RedisCanvas;
