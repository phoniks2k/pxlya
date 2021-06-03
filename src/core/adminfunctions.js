/*
 * functions for admintools
 *
 * @flow
 */

/* eslint-disable no-await-in-loop */

import sharp from 'sharp';
import Sequelize from 'sequelize';
import redis from '../data/redis';

import { admintoolsLogger } from './logger';
import { getIPv6Subnet } from '../utils/ip';
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
export async function executeIPAction(action: string, ips: string): string {
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

    admintoolsLogger.info(`ADMINTOOLS: ${action} ${ip}`);
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
    admintoolsLogger.info(`ADMINTOOLS: Loaded image wth ${pxlCount} pixels to ${x}/${y}`);
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
 * @param brcoor coords of bottom-right corner in X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
export async function executeProtAction(
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
  admintoolsLogger.info(
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
 * Execute rollback
 * @param date in format YYYYMMdd
 * @param ulcoor coords of upper-left corner in X_Y format
 * @param brcoor coords of bottom-right corner in X_Y format
 * @param canvasid numerical canvas id as string
 * @return [ret, msg] http status code and message
 */
export async function executeRollback(
  date: string,
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
  } else if (!date) {
    error = 'No date given';
  } else if (Number.isNaN(Number(date)) || date.length !== 8) {
    error = 'Invalid date';
  } else if (!canvas) {
    error = 'Invalid canvas selected';
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
  if (width * height > 1000000) {
    return [403, 'Can not rollback more than 1m pixels at onec'];
  }

  const pxlCount = await rollbackCanvasArea(
    canvasid,
    x,
    y,
    width,
    height,
    date,
  );
  admintoolsLogger.info(
    // eslint-disable-next-line max-len
    `ADMINTOOLS: Rollback to ${date} for ${pxlCount} pixels at ${x} / ${y} with dimension ${width}x${height}`,
  );
  return [
    200,
    // eslint-disable-next-line max-len
    `Successfully rolled back ${pxlCount} pixels at ${x} / ${y} with dimension ${width}x${height}`,
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

