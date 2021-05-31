/**
 *
 * @flow
 */

import fs from 'fs';
import type { Request, Response } from 'express';

import { BACKUP_DIR } from '../../core/config';

async function history(req: Request, res: Response) {
  const { day, id } = req.query;
  if (!BACKUP_DIR || !day || !id || day.includes('/') || day.includes('\\')) {
    res.status(404).end();
  }
  const yyyy = day.slice(0, 4);
  const mmdd = day.slice(4);
  const path = `${BACKUP_DIR}/${yyyy}/${mmdd}/${id}`;

  try {
    if (!fs.existsSync(path)) {
      res.status(404).end();
    }

    const dirs = fs.readdirSync(path);
    const filteredDir = dirs.filter((item) => item !== 'tiles');
    res.set({
      'Cache-Control': `public, max-age=${60 * 60}`, // seconds
    });
    res.json(filteredDir);
  } catch {
    res.status(404).end();
  }
}

export default history;
