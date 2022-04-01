/*
 * functions for admintools
 *
 */

/* eslint-disable no-await-in-loop */

import sharp from 'sharp';
import Sequelize from 'sequelize';
import redis from '../data/redis';

import { getIPv6Subnet } from '../utils/ip';
import { validateCoorRange } from '../utils/validation';
import CanvasCleaner from './CanvasCleaner';
import { Blacklist, Whitelist, RegUser } from '../data/models';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';
import {
  imageABGR2Canvas,
  protectCanvasArea,
} from './Image';
import rollbackCanvasArea from './rollback';

/*
 * Execute IP based actions (banning, whitelist, etc.)
 * @param action what to do with the ip
 * @param ip already sanizized ip
 * @return true if successful
 */
export async function executeIPAction(action, ips, logger = null) {
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

    if (logger) logger(`${action} ${ip}`);
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
export async function executeImageAction(
  action,
  file,
  coords,
  canvasid,
  logger = null,
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
    if (logger) logger(`Loaded image wth ${pxlCount} pixels to #${canvas.ident},${x},${y} (${x}_${y} - ${x + info.width - 1}_${y + info.height - 1}`);
    return [
      200,
      `Successfully loaded image wth ${pxlCount} pixels to ${x}/${y}`,
    ];
  } catch {
    return [400, 'Can not read image file'];
  }
}

/*
 * Execute actions for cleaning/filtering canvas
 * @param action what to do
 * @param ulcoor coords of upper-left corner in X_Y format
 * @param brcoor coords of bottom-right corner in X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
export async function executeCleanerAction(
  action,
  ulcoor,
  brcoor,
  canvasid,
  logger = null,
) {
  if (!canvasid) {
    return [403, 'canvasid not defined'];
  }
  const canvas = canvases[canvasid];
  let error = null;
  if (!ulcoor || !brcoor) {
    error = 'Not all coordinates defined';
  } else if (!canvas) {
    error = 'Invalid canvas selected';
  } else if (!action) {
    error = 'No cleanaction given';
  }
  if (error) {
    return [403, error];
  }

  const parseCoords = validateCoorRange(ulcoor, brcoor, canvas.size);
  if (typeof parseCoords === 'string') {
    return [403, parseCoords];
  }
  const [x, y, u, v] = parseCoords;

  error = CanvasCleaner.set(canvasid, x, y, u, v, action);
  if (error) {
    return [403, error];
  }
  // eslint-disable-next-line max-len
  const report = `Set Canvas Cleaner to ${action} canvas ${canvas.ident} from ${ulcoor} to ${brcoor}`;
  if (logger) logger(report);
  return [200, report];
}

/*
 * Execute actions for protecting areas
 * @param action what to do
 * @param ulcoor coords of upper-left corner in X_Y format
 * @param brcoor coords of bottom-right corner in X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
export async function executeProtAction(
  action,
  ulcoor,
  brcoor,
  canvasid,
  logger = null,
) {
  if (!canvasid) {
    return [403, 'canvasid not defined'];
  }
  const canvas = canvases[canvasid];
  let error = null;
  if (!ulcoor || !brcoor) {
    error = 'Not all coordinates defined';
  } else if (!canvas) {
    error = 'Invalid canvas selected';
  } else if (!action) {
    error = 'No imageaction given';
  } else if (action !== 'protect' && action !== 'unprotect') {
    error = 'Invalid action (must be protect or unprotect)';
  }
  if (error !== null) {
    return [403, error];
  }

  const parseCoords = validateCoorRange(ulcoor, brcoor, canvas.size);
  if (typeof parseCoords === 'string') {
    return [403, parseCoords];
  }
  const [x, y, u, v] = parseCoords;

  const width = u - x + 1;
  const height = v - y + 1;
  if (width * height > 10000000) {
    return [403, 'Can not set protection to more than 10m pixels at onec'];
  }
  const protect = action === 'protect';
  const pxlCount = await protectCanvasArea(
    canvasid,
    x,
    y,
    width,
    height,
    protect,
  );
  if (logger) {
    logger(
      (protect)
      // eslint-disable-next-line max-len
        ? `Protect ${width}x${height} area at #${canvasid},${x},${y} with ${pxlCount}pxls (${ulcoor} - ${brcoor})`
      // eslint-disable-next-line max-len
        : `Unprotect ${width}x${height} area at #${canvasid},${x},${y} with ${pxlCount}pxls (${ulcoor} - ${brcoor})`,
    );
  }
  return [
    200,
    (protect)
    // eslint-disable-next-line max-len
      ? `Successfully protected ${width}x${height} area at #${canvasid},${x},${y} with ${pxlCount}pxls (${ulcoor} - ${brcoor})`
    // eslint-disable-next-line max-len
      : `Successfully unprotected ${width}x${height} area at #${canvasid},${x},${y} with ${pxlCount}pxls (${ulcoor} - ${brcoor})`,
  ];
}

/*
 * Execute rollback
 * @param date in format YYYYMMdd
 * @param ulcoor coords of upper-left corner in X_Y format
 * @param brcoor coords of bottom-right corner in X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
export async function executeRollback(
  date,
  ulcoor,
  brcoor,
  canvasid,
  logger = null,
  isAdmin = false,
) {
  if (!canvasid) {
    return [403, 'canvasid not defined'];
  }
  const canvas = canvases[canvasid];
  let error = null;
  if (!ulcoor || !brcoor) {
    error = 'Not all coordinates defined';
  } else if (!canvas) {
    error = 'Invalid canvas selected';
  } else if (!date) {
    error = 'No date given';
  } else if (Number.isNaN(Number(date)) || date.length !== 8) {
    error = 'Invalid date';
  }
  if (error !== null) {
    return [403, error];
  }


  const parseCoords = validateCoorRange(ulcoor, brcoor, canvas.size);
  if (typeof parseCoords === 'string') {
    return [403, parseCoords];
  }
  const [x, y, u, v] = parseCoords;

  const width = u - x + 1;
  const height = v - y + 1;
  if (!isAdmin && width * height > 1000000) {
    return [403, 'Can not rollback more than 1m pixels at once'];
  }

  const pxlCount = await rollbackCanvasArea(
    canvasid,
    x,
    y,
    width,
    height,
    date,
  );
  if (logger) {
    logger(
    // eslint-disable-next-line max-len
      `Rollback to ${date} for ${width}x${height} area at #${canvas.ident},${x},${y} with ${pxlCount}pxls (${ulcoor} - ${brcoor})`,
    );
  }
  return [
    200,
    // eslint-disable-next-line max-len
    `Successfully rolled back to ${date} for ${width}x${height} area at #${canvas.ident},${x},${y} with ${pxlCount}pxls (${ulcoor} - ${brcoor})`,
  ];
}

/*
 * Get list of mods
 * @return [[id1, name2], [id2, name2], ...] list
 */
export async function getModList() {
  const mods = await RegUser.findAll({
    where: Sequelize.where(Sequelize.literal('roles & 1'), '!=', 0),
    attributes: ['id', 'name'],
    raw: true,
  });
  return mods.map((mod) => [mod.id, mod.name]);
}

export async function removeMod(userId) {
  if (Number.isNaN(userId)) {
    throw new Error('Invalid userId');
  }
  let user = null;
  try {
    user = await RegUser.findByPk(userId);
  } catch {
    throw new Error('Database error on remove mod');
  }
  if (!user) {
    throw new Error('User not found');
  }
  try {
    await user.update({
      isMod: false,
    });
    return `Moderation rights removed from user ${userId}`;
  } catch {
    throw new Error('Couldn\'t remove Mod from user');
  }
}

export async function makeMod(name) {
  if (!name) {
    throw new Error('No username given');
  }
  let user = null;
  try {
    user = await RegUser.findOne({
      where: {
        name,
      },
    });
  } catch {
    throw new Error(`Invalid user ${name}`);
  }
  if (!user) {
    throw new Error(`User ${name} not found`);
  }
  try {
    await user.update({
      isMod: true,
    });
    return [user.id, user.name];
  } catch {
    throw new Error('Couldn\'t remove Mod from user');
  }
}

