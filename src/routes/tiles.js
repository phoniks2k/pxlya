/**
 *
 * Serve zoomlevel tiles
 *
 */

import fs from 'fs';
import express from 'express';
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
  async (req, res) => {
    const { c: paramC } = req.params;
    const c = parseInt(paramC, 10);

    const filename = `${TILE_FOLDER}/${c}/emptytile.png`;
    if (!fs.existsSync(filename)) {
      res.set({
        'Cache-Control': `public, s-maxage=${24 * 3600}, max-age=${24 * 3600}`,
      });
      res.status(404).end();
      return;
    }

    res.set({
      'Cache-Control': `public, s-maxage=${2 * 3600}, max-age=${1 * 3600}`,
      'Content-Type': 'image/png',
    });
    res.status(200);
    res.sendFile(filename);
  });


export default router;
