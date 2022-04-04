/*
 * worker thread for ..core/tileserver.js
 */

/* eslint-disable no-console */

import { isMainThread, parentPort } from 'worker_threads';
import RedisCanvas from '../data/models/RedisCanvas';

import {
  createZoomTileFromChunk,
  createZoomedTile,
  createTexture,
  initializeTiles,
} from '../core/Tile';

if (isMainThread) {
  throw new Error(
    'Tilewriter is run as a worker thread, not as own process',
  );
}

parentPort.on('message', async (msg) => {
  const { task, args } = msg;
  switch (task) {
    case 'createZoomTileFromChunk':
      createZoomTileFromChunk(RedisCanvas, ...args);
      break;
    case 'createZoomedTile':
      createZoomedTile(...args);
      break;
    case 'createTexture':
      createTexture(RedisCanvas, ...args);
      break;
    case 'initializeTiles':
      await initializeTiles(RedisCanvas, ...args);
      parentPort.postMessage('Done!');
      break;
    default:
      console.warn(`Tiling: Main thread requested unknown task ${task}`);
  }
});
