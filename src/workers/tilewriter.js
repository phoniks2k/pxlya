/*
 * worker thread for ..core/tileserver.js
 */

/* eslint-disable no-console */

import { isMainThread, parentPort } from 'worker_threads';

import { connect as connectRedis } from '../data/redis/client';
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

connectRedis()
  .then(() => {
    parentPort.on('message', async (msg) => {
      const { task, args } = msg;
      try {
        switch (task) {
          case 'createZoomTileFromChunk':
            createZoomTileFromChunk(...args);
            break;
          case 'createZoomedTile':
            createZoomedTile(...args);
            break;
          case 'createTexture':
            createTexture(...args);
            break;
          case 'initializeTiles':
            try {
              await initializeTiles(...args);
              parentPort.postMessage('Done!');
            } catch (err) {
              console.warn(
                // eslint-disable-next-line max-len
                `Tiling: Error on initializeTiles args ${args}: ${err.message}`,
              );
              parentPort.postMessage('Failure!');
            }
            break;
          default:
            console.warn(`Tiling: Main thread requested unknown task ${task}`);
        }
      } catch (error) {
        console.warn(
          // eslint-disable-next-line max-len
          `Tiling: Error on executing task ${task} args ${args}: ${error.message}`,
        );
      }
    });
  });
