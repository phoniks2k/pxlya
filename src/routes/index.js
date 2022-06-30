/**
 *
 */

import express from 'express';
import etag from 'etag';
import path from 'path';

import ranking from './ranking';
import voidl from './void';
import history from './history';
import tiles from './tiles';
import chunks from './chunks';
import adminapi from './adminapi';
import captcha from './captcha';
import resetPassword from './reset_password';
import api from './api';

import assets from './assets.json'; // eslint-disable-line import/no-unresolved
import { expressTTag } from '../core/ttag';
import generateGlobePage from '../ssr/Globe';
import generateMainPage from '../ssr/Main';

import { MONTH } from '../core/constants';
import { GUILDED_INVITE } from '../core/config';

const router = express.Router();

/*
 * void info
 */
router.get('/void', voidl);

/*
 * ranking of pixels placed
 * daily and total
 */
router.get('/ranking', ranking);

/*
 * give: date per query
 * returns: array of HHMM backups available
 */
router.get('/history', history);

/*
 * zoomed tiles
 */
router.use('/tiles', tiles);

/*
 * adminapi
 */
router.use('/adminapi', adminapi);

/*
 * serve captcha
 */
router.get('/captcha.svg', captcha);

/*
 * public folder
 * (this should be served with nginx or other webserver)
 */
router.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 12 * MONTH,
  extensions: ['html'],
}));

/*
 * Redirect to guilded
 */
router.use('/guilded', (req, res) => {
  res.redirect(GUILDED_INVITE);
});

/*
 * Serving Chunks
 */
router.get(
  '/chunks/:c([0-9]+)/:x([0-9]+)/:y([0-9]+)(/)?:z([0-9]+)?.bmp',
  chunks,
);

/*
 * Following with translations
 * ---------------------------------------------------------------------------
 */
router.use(expressTTag);

/*
 * API calls
 */
router.use('/api', api);

/*
 * Password Reset Link
 */
router.use('/reset_password', resetPassword);

//
// 3D Globe (react generated)
// -----------------------------------------------------------------------------
const globeEtag = etag(
  assets.globe.js.join('_'),
  { weak: true },
);
router.get('/globe', async (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    'Content-Type': 'text/html; charset=utf-8',
    ETag: globeEtag,
  });

  if (req.headers['if-none-match'] === globeEtag) {
    res.status(304).end();
    return;
  }

  res.status(200).send(generateGlobePage(req.lang));
});

//
// Main Page (react generated)
// -----------------------------------------------------------------------------
const indexEtag = etag(
  assets.client.js.join('_'),
  { weak: true },
);

router.get('/', async (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    'Content-Type': 'text/html; charset=utf-8',
    ETag: indexEtag,
  });

  if (req.headers['if-none-match'] === indexEtag) {
    res.status(304).end();
    return;
  }

  res.status(200).send(generateMainPage(req.lang));
});

export default router;
