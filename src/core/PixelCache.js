/*
 * Caching pixels for a few ms before sending them
 * in bursts per chunk
 * @flow
 */

import webSockets from '../socket/websockets';

class PixelCache {
  PXL_CACHE: Map<number, Buffer>;

  constructor() {
    this.PXL_CACHE = new Map();
    this.flushCache = this.flushCache.bind(this);
  }

  /*
   * append pixel to cache
   * @param canvasId canvas id
   * @param i Chunk coordinates
   * @param j Chunk coordinates
   * @param offset Offset of pixel within chunk
   * @param color color index of pixel
   */
  append(
    canvasId: number,
    color: number,
    i: number,
    j: number,
    offset: number,
  ) {
    const { PXL_CACHE } = this;
    const chunkCanvasId = (canvasId << 16) | (i << 8) | j;

    const pxls = PXL_CACHE.get(chunkCanvasId);
    const newpxl = Buffer.allocUnsafe(4);

    newpxl.writeUInt8(offset >>> 16, 0);
    newpxl.writeUInt16BE(offset & 0x00FFFF, 1);
    newpxl.writeUInt8(color, 3);

    if (typeof pxls === 'undefined') {
      PXL_CACHE.set(chunkCanvasId, newpxl);
    } else {
      PXL_CACHE.set(
        chunkCanvasId,
        Buffer.concat([pxls, newpxl]),
      );
    }
  }

  flushCache() {
    const { PXL_CACHE: cache } = this;
    this.PXL_CACHE = new Map();

    cache.forEach((pxls, chunkCanvasId) => {
      const canvasId = chunkCanvasId & 0xFF0000 >> 16;
      const chunkId = chunkCanvasId & 0x00FFFF;
      webSockets.broadcastPixels(canvasId, chunkId, pxls);
    });
  }
}

const pixelCache = new PixelCache();
// send pixels from cache to websockets every 20ms
setInterval(pixelCache.flushCache, 20);

export default pixelCache;
