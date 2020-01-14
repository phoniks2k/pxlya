/* @flow */

import { getChunkOfPixel, getOffsetOfPixel } from '../../core/utils';
import { TILE_SIZE } from '../../core/constants';
import canvases from '../../canvases.json';
import logger from '../../core/logger';

import redis from '../redis';


const UINT_SIZE = 'u8';

const EMPTY_CACA = new Uint8Array(TILE_SIZE * TILE_SIZE);
const EMPTY_CHUNK_BUFFER = Buffer.from(EMPTY_CACA.buffer);

// cache existence of chunks
const chunks: Set<string> = new Set();


class RedisCanvas {
  // callback that gets informed about chunk changes
  static registerChunkChange = () => undefined;
  static setChunkChangeCallback(cb) {
    RedisCanvas.registerChunkChange = cb;
  }

  static getChunk(i: number, j: number, canvasId: number): Promise<Buffer> {
    // this key is also hardcoded into core/tilesBackup.js
    return redis.getAsync(`ch:${canvasId}:${i}:${j}`);
  }

  static async setChunk(i: number, j: number, chunk: Uint8Array,
    canvasId: number) {
    if (chunk.length !== TILE_SIZE * TILE_SIZE) {
      logger.error(`Tried to set chunk with invalid length ${chunk.length}!`);
      return false;
    }
    const key = `ch:${canvasId}:${i}:${j}`;
    await redis.setAsync(key, Buffer.from(chunk.buffer));
    RedisCanvas.registerChunkChange(canvasId, [i, j]);
    return true;
  }

  static async setPixel(
    x: number,
    y: number,
    color: number,
    canvasId: number,
  ) {
    const canvasSize = canvases[canvasId].size;
    const [i, j] = getChunkOfPixel([x, y], canvasSize);
    const offset = getOffsetOfPixel(x, y, canvasSize);
    RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  }

  static async setPixelInChunk(
    i: number,
    j: number,
    offset: number,
    color: number,
    canvasId: number,
  ) {
    const key = `ch:${canvasId}:${i}:${j}`;

    if (!chunks.has(key)) {
      await redis.setAsync(key, EMPTY_CHUNK_BUFFER, 'NX');
      chunks.add(key);
    }

    const args = [key, 'SET', UINT_SIZE, `#${offset}`, color];
    await redis.sendCommandAsync('bitfield', args);
    RedisCanvas.registerChunkChange(canvasId, [i, j]);
  }

  static async getPixelIfExists(
    x: number,
    y: number,
    canvasId: number,
  ): Promise<number> {
    // 1st and 2nd bit -> not used yet
    // 3rd bit -> protected or not
    // rest (5 bits) -> index of color
    const canvasSize = canvases[canvasId].size;
    const [i, j] = getChunkOfPixel([x, y], canvasSize);
    const offset = getOffsetOfPixel(x, y, canvasSize);
    const args = [
      `ch:${canvasId}:${i}:${j}`,
      'GET',
      UINT_SIZE,
      `#${offset}`,
    ];
    const result: ?number = await redis.sendCommandAsync('bitfield', args);
    if (!result) return null;
    const color = result[0];
    return color;
  }

  static async getPixel(
    x: number,
    y: number,
    canvasId: number,
  ): Promise<number> {
    const canvasAlpha = canvases[canvasId].alpha;
    const clr = RedisCanvas.getPixelIfExists(x, y, canvasId);
    return (clr == null) ? canvasAlpha : clr;
  }
}

export default RedisCanvas;
