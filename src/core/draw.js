/* @flow */

import { using } from 'bluebird';

import type { User } from '../data/models';
import { redlock } from '../data/redis';
import {
  getPixelFromChunkOffset,
} from './utils';
import logger, { pixelLogger } from './logger';
import RedisCanvas from '../data/models/RedisCanvas';
import {
  setPixelByOffset,
  setPixelByCoords,
} from './setPixel';
import rpgEvent from './event';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';

import { THREE_CANVAS_HEIGHT, THREE_TILE_SIZE, TILE_SIZE } from './constants';


/**
 *
 * By Offset is prefered on server side
 * This gets used by websocket pixel placing requests
 * @param user user that can be registered, but doesn't have to
 * @param canvasId
 * @param i Chunk coordinates
 * @param j
 * @param pixels Array of indiviual pixels within the chunk, with:
 *           [[offset, color], [offset2, color2],...]
 *           Offset is the offset of the pixel within the chunk
 * @return Promise<Object>
 */
export async function drawByOffsets(
  user: User,
  canvasId: number,
  i: number,
  j: number,
  pixels: Array,
): Promise<Object> {
  let wait = 0;
  let coolDown = 0;
  let retCode = 0;
  let pxlCnt = 0;

  const canvas = canvases[canvasId];
  if (!canvas) {
    // canvas doesn't exist
    return {
      wait,
      coolDown,
      pxlCnt,
      retCode: 1,
    };
  }
  const { size: canvasSize, v: is3d } = canvas;

  try {
    wait = await user.getWait(canvasId);

    const tileSize = (is3d) ? THREE_TILE_SIZE : TILE_SIZE;
    /*
     * canvas/chunk validation
     */
    if (i >= canvasSize / tileSize) {
      // x out of bounds
      throw new Error(2);
    }
    if (j >= canvasSize / tileSize) {
      // y out of bounds
      throw new Error(3);
    }
    if (canvas.req !== -1) {
      if (user.id === null) {
        // not logged in
        throw new Error(6);
      }
      const totalPixels = await user.getTotalPixels();
      if (totalPixels < canvas.req) {
        // not enough pixels placed yet
        throw new Error(7);
      }
    }

    const isAdmin = (user.userlvl === 1);
    let coolDownFactor = 1;
    if (rpgEvent.success) {
      if (rpgEvent.success === 1) {
        // if hourly event got won
        coolDownFactor = 0.5;
      } else {
        // if hourly event got lost
        coolDownFactor = 2;
      }
    }

    /*
     * TODO benchmark if requesting by pixel or chunk is better
     */

    while (pixels.length) {
      const [offset, color] = pixels.pop();


      const [x, y, z] = getPixelFromChunkOffset(i, j, offset, canvasSize, is3d);
      pixelLogger.info(
        `${user.ip} ${user.id} ${canvasId} ${x} ${y} ${z} ${color} ${retCode}`,
      );

      // eslint-disable-next-line no-await-in-loop
      const setColor = await RedisCanvas.getPixelByOffset(
        canvasId,
        i, j,
        offset,
      );

      /*
       * pixel validation
       */
      const maxSize = (is3d) ? tileSize * tileSize * THREE_CANVAS_HEIGHT
        : tileSize * tileSize;
      if (offset >= maxSize) {
        // z out of bounds or weird stuff
        throw new Error(4);
      }
      if (color >= canvas.colors.length
        || (color < canvas.cli && !(canvas.v && color === 0))
      ) {
        // color out of bounds
        throw new Error(5);
      }

      if (setColor & 0x80
        /* 3D Canvas Minecraft Avatars */
        // && x >= 96 && x <= 128 && z >= 35 && z <= 100
        // 96 - 128 on x
        // 32 - 128 on z
        || (canvas.v && i === 19 && j >= 17 && j < 20 && !isAdmin)
      ) {
        // protected pixel
        throw new Error(8);
      }

      coolDown = (setColor & 0x3F) < canvas.cli ? canvas.bcd : canvas.pcd;
      if (isAdmin) {
        coolDown = 0.0;
      } else {
        coolDown *= coolDownFactor;
      }

      wait += coolDown;
      if (wait > canvas.cds) {
        // cooldown stack used
        coolDown = canvas.cds - wait;
        wait -= coolDown;
        throw new Error(9);
      }

      setPixelByOffset(canvasId, color, i, j, offset);
      pxlCnt += 1;
    }
  } catch (e) {
    retCode = parseInt(e.message, 10);
    if (Number.isNaN(retCode)) {
      throw e;
    }
  }

  if (pxlCnt) {
    user.setWait(wait, canvasId);
    if (canvas.ranked) {
      user.incrementPixelcount(pxlCnt);
    }
  }

  return {
    wait,
    coolDown,
    pxlCnt,
    retCode,
  };
}


/**
 *
 * Old version of draw that returns explicit error messages
 * used for http json api/pixel, used with coordinates
 * @param user
 * @param canvasId
 * @param x
 * @param y
 * @param color
 * @returns {Promise.<Object>}
 */
export async function drawByCoords(
  user: User,
  canvasId: number,
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
): Promise<Object> {
  if (!({}.hasOwnProperty.call(canvases, canvasId))) {
    return {
      error: 'This canvas does not exist',
      success: false,
    };
  }
  const canvas = canvases[canvasId];

  const canvasMaxXY = canvas.size / 2;
  const canvasMinXY = -canvasMaxXY;
  if (x < canvasMinXY || x >= canvasMaxXY) {
    return {
      error: 'x Coordinate not within canvas',
      success: false,
    };
  }
  if (canvas.v) {
    if (z < canvasMinXY || z >= canvasMaxXY) {
      return {
        error: 'z Coordinate not within canvas',
        success: false,
      };
    }
    if (y >= THREE_CANVAS_HEIGHT) {
      return {
        error: 'You reached build limit. Can\'t place higher than 128 blocks.',
        success: false,
      };
    }
    if (y < 0) {
      return {
        error: 'Can\'t place on y < 0',
        success: false,
      };
    }
    if (z === null) {
      return {
        error: 'This is a 3D canvas. z is required.',
        success: false,
      };
    }
  } else {
    if (y < canvasMinXY || y >= canvasMaxXY) {
      return {
        error: 'y Coordinate not within canvas',
        success: false,
      };
    }
    if (color < canvas.cli) {
      return {
        error: 'Invalid color selected',
        success: false,
      };
    }
    if (z !== null) {
      if (!canvas.v) {
        return {
          error: 'This is not a 3D canvas',
          success: false,
        };
      }
    }
  }

  if (color < 0 || color >= canvas.colors.length) {
    return {
      error: 'Invalid color selected',
      success: false,
    };
  }

  if (canvas.req !== -1) {
    if (user.id === null) {
      return {
        errorTitle: 'Not Logged In',
        error: 'You need to be logged in to use this canvas.',
        success: false,
      };
    }
    // if the canvas has a requirement of totalPixels that the user
    // has to have set
    const totalPixels = await user.getTotalPixels();
    if (totalPixels < canvas.req) {
      return {
        errorTitle: 'Not Yet :(',
        // eslint-disable-next-line max-len
        error: `You need to set ${canvas.req} pixels on another canvas first, before you can use this one.`,
        success: false,
      };
    }
  }

  const isAdmin = (user.userlvl === 1);
  const setColor = await RedisCanvas.getPixel(canvasId, x, y, z);

  let coolDown = (setColor & 0x3F) < canvas.cli ? canvas.bcd : canvas.pcd;
  if (isAdmin) {
    coolDown = 0.0;
  } else if (rpgEvent.success) {
    if (rpgEvent.success === 1) {
      // if HOURLY_EVENT got won
      coolDown /= 2;
    } else {
      // if HOURLY_EVENT got lost
      coolDown *= 2;
    }
  }

  const now = Date.now();
  let wait = await user.getWait(canvasId);
  if (!wait) wait = now;
  wait += coolDown;
  const waitLeft = wait - now;
  if (waitLeft > canvas.cds) {
    return {
      success: false,
      waitSeconds: (waitLeft - coolDown) / 1000,
      coolDownSeconds: (canvas.cds - waitLeft) / 1000,
    };
  }

  if (setColor & 0x80
    || (canvas.v
      && x >= 96 && x <= 128 && z >= 35 && z <= 100
      && !isAdmin)
  ) {
    logger.info(`${user.ip} tried to set on protected pixel (${x}, ${y})`);
    return {
      errorTitle: 'Pixel Protection',
      error: 'This pixel is protected',
      success: false,
      waitSeconds: (waitLeft - coolDown) / 1000,
    };
  }

  setPixelByCoords(canvasId, color, x, y, z);

  user.setWait(waitLeft, canvasId);
  if (canvas.ranked) {
    user.incrementPixelcount();
  }
  return {
    success: true,
    waitSeconds: waitLeft / 1000,
    coolDownSeconds: coolDown / 1000,
  };
}


/**
 * This function is a wrapper for draw. It fixes race condition exploits
 * It permits just placing one pixel at a time per user.
 *
 * @param user
 * @param canvasId
 * @param color
 * @param x
 * @param y
 * @param z (optional for 3d canvas)
 */
export function drawSafeByCoords(
  user: User,
  canvasId: number,
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
): Promise<Object> {
  // can just check for one unique occurence,
  // we use ip, because id for logged out users is
  // always null
  const userId = user.ip;

  return new Promise((resolve) => {
    using(
      redlock.disposer(`locks:${userId}`, 5000, logger.error),
      async () => {
        const ret = await drawByCoords(user, canvasId, color, x, y, z);
        resolve(ret);
      },
    ); // <-- unlock is automatically handled by bluebird
  });
}


/**
 * This function is a wrapper for draw. It fixes race condition exploits
 * It permits just placing one pixel at a time per user.
 *
 * @param user
 * @param canvasId
 * @param i Chunk coordinates
 * @param j
 * @param pixels Array of indiviual pixels within the chunk, with:
 *           [[offset, color], [offset2, color2],...]
 *           Offset is the offset of the pixel within the chunk
 * @return Promise<Object>
 */
export function drawSafeByOffsets(
  user: User,
  canvasId: number,
  i: number,
  j: number,
  pixels: Array,
): Promise<Object> {
  // can just check for one unique occurence,
  // we use ip, because id for logged out users is
  // always null
  const userId = user.ip;

  return new Promise((resolve) => {
    using(
      redlock.disposer(`locks:${userId}`, 5000, logger.error),
      async () => {
        const ret = await drawByOffsets(user, canvasId, i, j, pixels);
        resolve(ret);
      },
    ); // <-- unlock is automatically handled by bluebird
  });
}
