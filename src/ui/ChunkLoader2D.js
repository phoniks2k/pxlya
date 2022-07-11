/*
 * Fetching and storing of 2D chunks
 */

import ChunkRGB from './ChunkRGB';
import { TILE_SIZE, TILE_ZOOM_LEVEL } from '../core/constants';
import {
  loadingTiles,
  loadImage,
} from './loadImage';
import {
  requestBigChunk,
  receiveBigChunk,
  receiveBigChunkFailure,
  // preLoadedBigChunk,
} from '../store/actions';
import {
  getMaxTiledZoom,
  getCellInsideChunk,
  getChunkOfPixel,
  getHistoricalCanvasSize,
} from '../core/utils';

class ChunkLoader {
  store = null;
  canvasId;
  canvasMaxTiledZoom;
  historicalMaxTiledZooms;
  palette;
  canvasSize;
  chunks;

  constructor(store, canvasId, palette, canvasSize, historicalSizes) {
    this.store = store;
    this.canvasId = canvasId;
    this.palette = palette;
    this.canvasSize = canvasSize;
    this.canvasMaxTiledZoom = getMaxTiledZoom(canvasSize);

    if (historicalSizes) {
      this.historicalMaxTiledZooms = historicalSizes.map((ts) => {
        const [date, size] = ts;
        return [date, getMaxTiledZoom(size)];
      });
    } else {
      this.historicalMaxTiledZooms = [];
    }

    this.chunks = new Map();
  }

  getAllChunks() {
    return this.chunks;
  }

  getPixelUpdate(
    cx,
    cy,
    offset,
    color,
  ) {
    const chunk = this.chunks.get(`${this.canvasMaxTiledZoom}:${cx}:${cy}`);
    if (chunk) {
      const ix = offset % TILE_SIZE;
      const iy = Math.floor(offset / TILE_SIZE);
      chunk.setColor([ix, iy], color);
    }
  }

  getColorIndexOfPixel(
    x,
    y,
  ) {
    const { canvasSize } = this;
    const [cx, cy] = getChunkOfPixel(canvasSize, x, y);
    const key = `${this.canvasMaxTiledZoom}:${cx}:${cy}`;
    const chunk = this.chunks.get(key);
    if (!chunk) {
      return 0;
    }
    return chunk.getColorIndex(
      getCellInsideChunk(canvasSize, [x, y]),
    );
  }

  /*
   * Get color of pixel in current historical view
   * (has to account for canvs size changes in the past
   * @param x, y world coordiantes of pixel
   * @return ColorIndex or null if chunks not loaded or historical view not set
   */
  getHistoricalIndexOfPixel(
    x,
    y,
    historicalDate,
    historicalTime,
    historicalCanvasSize,
  ) {
    if (!historicalDate) {
      return null;
    }
    const [cx, cy] = getChunkOfPixel(historicalCanvasSize, x, y);
    const px = getCellInsideChunk(historicalCanvasSize, [x, y]);
    const curTime = Date.now();

    if (historicalTime && historicalTime !== '0000') {
      // eslint-disable-next-line max-len
      const incrementialChunkKey = `${historicalDate}${historicalTime}:${cx}:${cy}`;
      const incrementialChunk = this.chunks.get(incrementialChunkKey);
      if (incrementialChunk) {
        const incrementialColor = incrementialChunk.getColorIndex(px, false);
        incrementialChunk.timestamp = curTime;
        if (incrementialColor !== null) {
          return incrementialColor;
        }
      }
    }

    const chunkKey = `${historicalDate}:${cx}:${cy}`;
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) {
      return null;
    }
    chunk.timestamp = curTime;
    return chunk.getColorIndex(px);
  }

  /*
   * preLoad chunks by generating them out of
   * available lower zoomlevel chunks
   */
  preLoadChunk(
    zoom,
    cx,
    cy,
    chunkRGB,
  ) {
    if (zoom <= 0) return null;

    try {
      // first try if one zoomlevel higher is available (without fetching it)
      let plZoom = zoom - 1;
      let zoomDiffAbs = TILE_ZOOM_LEVEL;
      let [plX, plY] = [cx, cy].map((z) => (Math.floor(z / zoomDiffAbs)));
      let plChunk = this.getChunk(plZoom, plX, plY, false, false, true);
      if (!plChunk) {
        // if not, try one more zoomlevel higher, fetching it if not available
        if (plZoom > 0) {
          plZoom -= 1;
        }
        zoomDiffAbs = TILE_ZOOM_LEVEL ** (zoom - plZoom);
        [plX, plY] = [cx, cy].map((z) => (Math.floor(z / zoomDiffAbs)));
        plChunk = this.getChunk(plZoom, plX, plY, true, false, true);
      }
      if (plChunk) {
        const pcX = (cx % zoomDiffAbs) * TILE_SIZE / zoomDiffAbs;
        const pcY = (cy % zoomDiffAbs) * TILE_SIZE / zoomDiffAbs;
        chunkRGB.preLoad(plChunk, zoomDiffAbs, pcX, pcY);
        // fetching of preLoad chunk triggers rerender already
        // lets keep this commented out for now
        // this.store.dispatch(preLoadedBigChunk([zoom, cx, cy]));
        return chunkRGB.image;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error occured while preloading for ${zoom}:${cx}:${cy}`,
        error);
      return null;
    }
    return null;
  }


  getChunk(
    zoom,
    cx,
    cy,
    fetch = true,
    showLoadingTile = true,
    chunkPreLoading = true,
  ) {
    const chunkKey = `${zoom}:${cx}:${cy}`;
    let chunkRGB = this.chunks.get(chunkKey);
    if (chunkRGB) {
      if (chunkRGB.ready) {
        return chunkRGB.image;
      }
    } else if (fetch) {
      chunkRGB = new ChunkRGB(this.palette, zoom, cx, cy);
      this.chunks.set(chunkKey, chunkRGB);
      // fetch chunk
      if (this.canvasMaxTiledZoom === zoom) {
        this.fetchBaseChunk(zoom, cx, cy, chunkRGB);
      } else {
        this.fetchTile(zoom, cx, cy, chunkRGB);
      }
    }
    if (chunkPreLoading && chunkRGB) {
      const preLoad = this.preLoadChunk(zoom, cx, cy, chunkRGB);
      if (preLoad) return preLoad;
    }
    return (showLoadingTile) ? loadingTiles.getTile(this.canvasId) : null;
  }

  getHistoricalChunk(cx, cy, fetch, historicalDate, historicalTime = null) {
    let chunkKey = (historicalTime)
      ? `${historicalDate}${historicalTime}`
      : historicalDate;
    chunkKey += `:${cx}:${cy}`;
    const chunk = this.chunks.get(chunkKey);
    const { canvasId } = this;
    if (chunk) {
      if (chunk.ready) {
        return chunk.image;
      }
      return (historicalTime) ? null : loadingTiles.getTile(canvasId);
    } if (fetch) {
      const historicalCanvasMaxTiledZoom = getHistoricalCanvasSize(
        historicalDate,
        this.canvasMaxTiledZoom,
        this.historicalMaxTiledZooms,
      );
      // fetch tile
      const chunkRGB = new ChunkRGB(
        this.palette,
        historicalCanvasMaxTiledZoom,
        cx,
        cy,
      );
      this.chunks.set(chunkKey, chunkRGB);
      this.fetchHistoricalChunk(
        cx,
        cy,
        historicalDate,
        historicalTime,
        historicalCanvasMaxTiledZoom,
        chunkRGB,
      );
    }
    return (historicalTime) ? null : loadingTiles.getTile(canvasId);
  }

  async fetchHistoricalChunk(
    cx,
    cy,
    historicalDate,
    historicalTime,
    historicalCanvasMaxTiledZoom,
    chunkRGB,
  ) {
    const { canvasId } = this;

    const center = [historicalCanvasMaxTiledZoom, cx, cy];
    // eslint-disable-next-line max-len
    let url = `${window.ssv.backupurl}/${historicalDate.slice(0, 4)}/${historicalDate.slice(4, 6)}/${historicalDate.slice(6)}/`;
    if (historicalTime) {
      // incremential tiles
      url += `${canvasId}/${historicalTime}/${cx}/${cy}.png`;
    } else {
      // full tiles
      url += `${canvasId}/tiles/${cx}/${cy}.png`;
    }
    this.store.dispatch(requestBigChunk(center));
    try {
      const img = await loadImage(url);
      chunkRGB.fromImage(img);
      this.store.dispatch(receiveBigChunk(center, chunkRGB));
    } catch (error) {
      this.store.dispatch(receiveBigChunkFailure(center, error));
      if (historicalTime) {
        chunkRGB.empty(true);
      } else {
        chunkRGB.empty();
      }
    }
  }

  async fetchBaseChunk(zoom, cx, cy, chunkRGB) {
    const center = [zoom, cx, cy];
    this.store.dispatch(requestBigChunk(center));
    try {
      const url = `chunks/${this.canvasId}/${cx}/${cy}.bmp`;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength) {
          const chunkArray = new Uint8Array(arrayBuffer);
          chunkRGB.fromBuffer(chunkArray);
        } else {
          throw new Error('Chunk response was invalid');
        }
        this.store.dispatch(receiveBigChunk(center, chunkRGB));
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      chunkRGB.empty();
      this.store.dispatch(receiveBigChunkFailure(center, error));
    }
  }

  async fetchTile(zoom, cx, cy, chunkRGB) {
    const center = [zoom, cx, cy];
    this.store.dispatch(requestBigChunk(center));
    try {
      const url = `tiles/${this.canvasId}/${zoom}/${cx}/${cy}.webp`;
      const img = await loadImage(url);
      chunkRGB.fromImage(img);
      this.store.dispatch(receiveBigChunk(center, chunkRGB));
    } catch (error) {
      this.store.dispatch(receiveBigChunkFailure(center, error));
      chunkRGB.empty();
    }
  }
}

export default ChunkLoader;
