/**
 * basic admin api
 * is used by ../components/Admintools
 *
 * @flow
 *
 */

/* eslint-disable no-await-in-loop */

import express from 'express';
import expressLimiter from 'express-limiter';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
import sharp from 'sharp';
import multer from 'multer';

import { getIPFromRequest, getIPv6Subnet } from '../utils/ip';
import redis from '../data/redis';
import session from '../core/session';
import passport from '../core/passport';
import logger from '../core/logger';
import { Blacklist, Whitelist } from '../data/models';

import { MINUTE } from '../core/constants';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';
import {
  imageABGR2Canvas,
  protectCanvasArea,
} from '../core/Image';


const router = express.Router();
const limiter = expressLimiter(router, redis);


/*
 * multer middleware for getting POST parameters
 * into req.file (if file) and req.body for text
 */
router.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


/*
 * rate limiting to prevent bruteforce attacks
 */
router.use('/',
  limiter({
    lookup: 'headers.cf-connecting-ip',
    total: 240,
    expire: 5 * MINUTE,
    skipHeaders: true,
  }));


/*
 * make sure User is logged in and admin
 */
router.use(session);
router.use(passport.initialize());
router.use(passport.session());
router.use(async (req, res, next) => {
  const ip = getIPFromRequest(req);
  if (!req.user) {
    logger.info(`ADMINTOOLS: ${ip} tried to access admintools without login`);
    res.status(403).send('You are not logged in');
    return;
  }
  if (!req.user.isAdmin()) {
    logger.info(
      `ADMINTOOLS: ${ip} / ${req.user.id} tried to access admintools`,
    );
    res.status(403).send('You are not allowed to access this page');
    return;
  }
  logger.info(
    `ADMINTOOLS: ${req.user.id} / ${req.user.regUser.name} is using admintools`,
  );
  next();
});


/*
 * Execute IP based actions (banning, whitelist, etc.)
 * @param action what to do with the ip
 * @param ip already sanizized ip
 * @return true if successful
 */
async function executeIPAction(action: string, ips: string): boolean {
  const ipArray = ips.split('\n');
  let out = '';
  const splitRegExp = /\s+/;
  for (let i = 0; i < ipArray.length; i += 1) {
    let ip = ipArray[i].trim();
    const ipLine = ip.split(splitRegExp);
    if (ipLine.length === 7) {
      // logger output
      // eslint-disable-next-line prefer-destructuring
      ip = ipLine[2];
    }
    if (!ip || ip.length < 8 || ip.indexOf(' ') !== -1) {
      out += `Couln't parse ${action} ${ip}\n`;
      continue;
    }
    const ipKey = getIPv6Subnet(ip);
    const key = `isprox:${ipKey}`;

    logger.info(`ADMINTOOLS: ${action} ${ip}`);
    switch (action) {
      case 'ban':
        await Blacklist.findOrCreate({
          where: { ip: ipKey },
        });
        await redis.setAsync(key, 'y', 'EX', 24 * 3600);
        break;
      case 'unban':
        await Blacklist.destroy({
          where: { ip: ipKey },
        });
        await redis.del(key);
        break;
      case 'whitelist':
        await Whitelist.findOrCreate({
          where: { ip: ipKey },
        });
        await redis.setAsync(key, 'n', 'EX', 24 * 3600);
        break;
      case 'unwhitelist':
        await Whitelist.destroy({
          where: { ip: ipKey },
        });
        await redis.del(key);
        break;
      default:
        out += `Failed to ${action} ${ip}\n`;
    }
    out += `Succseefully did ${action} ${ip}\n`;
  }
  return out;
}

/*
 * Execute Image based actions (upload, protect, etc.)
 * @param action what to do with the image
 * @param file imagefile
 * @param coords coord sin X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
async function executeImageAction(
  action: string,
  file: Object,
  coords: string,
  canvasid: string,
) {
  if (!coords) {
    return [403, 'Coordinates not defined'];
  }
  if (!canvasid) {
    return [403, 'canvasid not defined'];
  }

  const splitCoords = coords.trim().split('_');
  if (splitCoords.length !== 2) {
    return [403, 'Invalid Coordinate Format'];
  }
  const [x, y] = splitCoords.map((z) => Math.floor(Number(z)));

  const canvas = canvases[canvasid];

  let error = null;
  if (Number.isNaN(x)) {
    error = 'x is not a valid number';
  } else if (Number.isNaN(y)) {
    error = 'y is not a valid number';
  } else if (!action) {
    error = 'No imageaction given';
  } else if (!canvas) {
    error = 'Invalid canvas selected';
  } else if (canvas.v) {
    error = 'Can not upload Image to 3D canvas';
  }
  if (error !== null) {
    return [403, error];
  }

  const canvasMaxXY = canvas.size / 2;
  const canvasMinXY = -canvasMaxXY;
  if (x < canvasMinXY || y < canvasMinXY
      || x >= canvasMaxXY || y >= canvasMaxXY) {
    return [403, 'Coordinates are outside of canvas'];
  }

  const protect = (action === 'protect');
  const wipe = (action === 'wipe');

  try {
    const { data, info } = await sharp(file.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pxlCount = await imageABGR2Canvas(
      canvasid,
      x, y,
      data,
      info.width, info.height,
      wipe, protect,
    );

    // eslint-disable-next-line max-len
    logger.info(`ADMINTOOLS: Loaded image wth ${pxlCount} pixels to ${x}/${y}`);
    return [
      200,
      `Successfully loaded image wth ${pxlCount} pixels to ${x}/${y}`,
    ];
  } catch {
    return [400, 'Can not read image file'];
  }
}

/*
 * Execute actions for protecting areas
 * @param action what to do
 * @param ulcoor coords of upper-left corner in X_Y format
 * @param brcoord coords of bottom-right corner in X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
async function executeProtAction(
  action: string,
  ulcoor: string,
  brcoor: string,
  canvasid: number,
) {
  if (!ulcoor || !brcoor) {
    return [403, 'Not all coordinates defined'];
  }
  if (!canvasid) {
    return [403, 'canvasid not defined'];
  }

  let splitCoords = ulcoor.trim().split('_');
  if (splitCoords.length !== 2) {
    return [403, 'Invalid Coordinate Format for top-left corner'];
  }
  const [x, y] = splitCoords.map((z) => Math.floor(Number(z)));
  splitCoords = brcoor.trim().split('_');
  if (splitCoords.length !== 2) {
    return [403, 'Invalid Coordinate Format for bottom-right corner'];
  }
  const [u, v] = splitCoords.map((z) => Math.floor(Number(z)));

  const canvas = canvases[canvasid];

  let error = null;
  if (Number.isNaN(x)) {
    error = 'x of top-left corner is not a valid number';
  } else if (Number.isNaN(y)) {
    error = 'y of top-left corner is not a valid number';
  } else if (Number.isNaN(u)) {
    error = 'x of bottom-right corner is not a valid number';
  } else if (Number.isNaN(v)) {
    error = 'y of bottom-right corner is not a valid number';
  } else if (u < x || v < y) {
    error = 'Corner coordinates are alligned wrong';
  } else if (!action) {
    error = 'No imageaction given';
  } else if (!canvas) {
    error = 'Invalid canvas selected';
  } else if (!canvases[canvasid]) {
    error = 'Invalid canvas selected';
  } else if (action !== 'protect' && action !== 'unprotect') {
    error = 'Invalid action (must be protect or unprotect)';
  }
  if (error !== null) {
    return [403, error];
  }

  const canvasMaxXY = canvas.size / 2;
  const canvasMinXY = -canvasMaxXY;
  if (x < canvasMinXY || y < canvasMinXY
      || x >= canvasMaxXY || y >= canvasMaxXY) {
    return [403, 'Coordinates of top-left corner are outside of canvas'];
  }
  if (u < canvasMinXY || v < canvasMinXY
      || u >= canvasMaxXY || v >= canvasMaxXY) {
    return [403, 'Coordinates of bottom-right corner are outside of canvas'];
  }

  const width = u - x + 1;
  const height = v - y + 1;
  const protect = action === 'protect';
  const pxlCount = await protectCanvasArea(
    canvasid,
    x,
    y,
    width,
    height,
    protect,
  );
  logger.info(
    // eslint-disable-next-line max-len
    `ADMINTOOLS: Set protect to ${protect} for ${pxlCount} pixels at ${x} / ${y} with dimension ${width}x${height}`,
  );
  return [
    200,
    (protect)
    // eslint-disable-next-line max-len
      ? `Successfully protected ${pxlCount} pixels at ${x} / ${y} with dimension ${width}x${height}`
    // eslint-disable-next-line max-len
      : `Soccessfully unprotected ${pxlCount} pixels at ${x} / ${y} with dimension ${width}x${height}`,
  ];
}


/*
 * Check for POST parameters,
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (req.body.imageaction) {
      const { imageaction, coords, canvasid } = req.body;
      const [ret, msg] = await executeImageAction(
        imageaction,
        req.file,
        coords,
        canvasid,
      );
      res.status(ret).send(msg);
      return;
    } if (req.body.ipaction) {
      const ret = await executeIPAction(req.body.ipaction, req.body.ip);
      res.status(200).send(ret);
      return;
    } if (req.body.protaction) {
      const {
        protaction, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeProtAction(
        protaction,
        ulcoor,
        brcoor,
        canvasid,
      );
      res.status(ret).send(msg);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
});


/*
 * Check GET parameters for action to execute
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { ip, ipaction } = req.query;
    if (!ipaction) {
      next();
      return;
    }
    if (!ip) {
      res.status(400).json({ errors: 'invalid ip' });
      return;
    }

    const ret = await executeIPAction(ipaction, ip);

    res.json({ ipaction: 'success', messages: ret.split('\n') });
  } catch (error) {
    next(error);
  }
});


router.use(async (req: Request, res: Response) => {
  res.status(400).send('Invalid request');
});


export default router;
