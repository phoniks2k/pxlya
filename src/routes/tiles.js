/**
 *
 * Serve zoomlevel tiles
 *
 * @flow
 */

import express from 'express';
import type { Request, Response } from 'express';
import { TILE_FOLDER } from '../core/config';
import { HOUR } from '../core/constants';


const router = express.Router();

/*
 * get other tiles from directory
 */
router.use('/', express.static(TILE_FOLDER, {
  maxAge: 2 * HOUR,
}));


/*
 * catch File Not Found: Send empty tile
 */
router.use('/:c([0-9]+)/:z([0-9]+)/:x([0-9]+)/:y([0-9]+).png',
  async (req: Request, res: Response) => {
    const { c: paramC } = req.params;
    const c = parseInt(paramC, 10);
    res.set({
      'Cache-Control': `public, s-maxage=${2 * 3600}, max-age=${1 * 3600}`,
      'Content-Type': 'image/png',
    });
    res.status(200);
    res.sendFile(`${TILE_FOLDER}/${c}/emptytile.png`);
  });


export default router;
