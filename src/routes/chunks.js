/**
 *
 * Outputs binary chunk directly from redis
 *
 * @flow
 */

import type { Request, Response } from 'express';
import etag from 'etag';
import RedisCanvas from '../data/models/RedisCanvas';
import {
  TILE_SIZE,
  THREE_TILE_SIZE,
  THREE_CANVAS_HEIGHT,
} from '../core/constants';
import logger from '../core/logger';

const chunkEtags = new Map();
RedisCanvas.setChunkChangeCallback((canvasId, cell) => {
  const [x, y] = cell;
  const ret = chunkEtags.delete(`${canvasId}:${x}:${y}`);
});

/*
 * Send binary chunk to the client
 */
export default async (req: Request, res: Response, next) => {
  const {
    c: paramC,
    x: paramX,
    y: paramY,
  } = req.params;
  const c = parseInt(paramC, 10);
  const x = parseInt(paramX, 10);
  const y = parseInt(paramY, 10);
  try {
    // botters where using cachebreakers to update via chunk API
    // lets not allow that for now
    if (Object.keys(req.query).length !== 0) {
      res.status(400).end();
      return;
    }

    const etagKey = `${c}:${x}:${y}`;
    let curEtag = chunkEtags.get(etagKey);
    const preEtag = req.headers['if-none-match'];

    if (curEtag && preEtag === curEtag) {
      res.status(304).end();
      return;
    }

    let chunk;
    try {
      const stime = Date.now();
      chunk = await RedisCanvas.getChunk(c, x, y);
      const dur = Date.now() - stime;
      if (dur > 1000) {
        // eslint-disable-next-line max-len
        logger.warn(`Long redis response times of ${dur}ms for chunk ${c}:${x},${y}`);
      }
    } catch {
      res.status(503).end();
      return;
    }

    res.set({
      'Cache-Control': `public, s-maxage=${60 * 2}, max-age=${50 * 2}`, // seconds
      'Content-Type': 'application/octet-stream',
    });

    if (!chunk) {
      res.status(200).end();
      return;
    }

    // for temporary logging to see if we have invalid chunks in redis

    if (chunk.length !== TILE_SIZE * TILE_SIZE
      && chunk.length !== (THREE_TILE_SIZE ** 2) * THREE_CANVAS_HEIGHT) {
      logger.error(`Chunk ${x},${y}/${c} has invalid length ${chunk.length}!`);
    }

    curEtag = etag(chunk, { weak: true });
    res.set({
      ETag: curEtag,
    });
    chunkEtags.set(etagKey, curEtag);
    if (preEtag === curEtag) {
      res.status(304).end();
      return;
    }

    res.end(chunk, 'binary');
  } catch (error) {
    next(error);
  }
};
