/* @flow */
import RedisCanvas from '../data/models/RedisCanvas';
import webSockets from '../socket/websockets';
import {
  getChunkOfPixel,
  getOffsetOfPixel,
} from './utils';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';


/**
 *
 * @param canvasId
 * @param canvasId
 * @param color
 * @param x
 * @param y
 * @param z optional, if given its 3d canvas
 */
export function setPixelByCoords(
  canvasId: number,
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
) {
  const canvasSize = canvases[canvasId].size;
  const [i, j] = getChunkOfPixel(canvasSize, x, y, z);
  const offset = getOffsetOfPixel(canvasSize, x, y, z);
  RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  webSockets.broadcastPixel(canvasId, i, j, offset, color);
}

/**
 *
 * By Offset is prefered on server side
 * @param canvasId
 * @param i Chunk coordinates
 * @param j
 * @param offset Offset of pixel withing chunk
 */
export function setPixelByOffset(
  canvasId: number,
  color: ColorIndex,
  i: number,
  j: number,
  offset: number,
) {
  RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  webSockets.broadcastPixel(canvasId, i, j, offset, color);
}
