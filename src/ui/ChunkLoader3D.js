/*
 * Loading 3D chunks
 *
 */

import {
  requestBigChunk,
  receiveBigChunk,
  receiveBigChunkFailure,
} from '../store/actions';
import {
  getChunkOfPixel,
  getOffsetOfPixel,
} from '../core/utils';

import Chunk from './ChunkRGB3D';


class ChunkLoader {
  store = null;
  canvasId;
  palette;
  chunks; // Map<string, Chunk>

  constructor(store, canvasId, palette, canvasSize) {
    this.store = store;
    this.canvasId = canvasId;
    this.palette = palette;
    this.canvasSize = canvasSize;
    this.chunks = new Map();
  }

  destructor() {
    this.chunks.forEach((chunk) => {
      chunk.destructor();
    });
    this.chunks = new Map();
  }

  getVoxel(x, y, z) {
    const { canvasSize } = this;
    const [xc, zc] = getChunkOfPixel(canvasSize, x, y, z);
    const offset = getOffsetOfPixel(canvasSize, x, y, z);
    const key = `${xc}:${zc}`;
    const chunk = this.chunks.get(key);
    if (chunk) {
      const clr = chunk.getVoxelByOffset(offset);
      return clr;
    }
    return 0;
  }

  getAllChunks() {
    return this.chunks;
  }

  getVoxelUpdate(
    xc,
    zc,
    offset,
    color,
  ) {
    const key = `${xc}:${zc}`;
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.setVoxelByOffset(offset, color);
    }
  }

  getChunk(xc, zc, fetch) {
    const chunkKey = `${xc}:${zc}`;
    // console.log(`Get chunk ${chunkKey}`);
    let chunk = this.chunks.get(chunkKey);
    if (chunk) {
      if (chunk.ready) {
        chunk.timestamp = Date.now();
        return chunk.mesh;
      }
      return null;
    }
    if (fetch) {
      // fetch chunk
      chunk = new Chunk(this.palette, chunkKey, xc, zc);
      this.chunks.set(chunkKey, chunk);
      this.fetchChunk(xc, zc, chunk);
    }
    return null;
  }

  async fetchChunk(cx, cz, chunk) {
    const center = [0, cx, cz];
    this.store.dispatch(requestBigChunk(center));
    try {
      const url = `chunks/${this.canvasId}/${cx}/${cz}.bmp`;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength) {
          const chunkArray = new Uint8Array(arrayBuffer);
          chunk.fromBuffer(chunkArray);
        } else {
          throw new Error('Chunk response was invalid');
        }
        this.store.dispatch(receiveBigChunk(center, chunk));
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      chunk.empty();
      this.store.dispatch(receiveBigChunkFailure(center, error));
    }
  }

  /*
  // sine environment creation for load tests
  async fetchChunk(xc, zc, chunk) {
    const { key } = chunk;
    console.log(`Fetch chunk ${key}`);
    await chunk.generateSin();
    this.store.dispatch(receiveBigChunk(key));
  }
  */
}

export default ChunkLoader;
