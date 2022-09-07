/*
 * draw pixel on canvas
 */

import {
  getPixelFromChunkOffset,
} from './utils';
import logger, { pixelLogger } from './logger';
import RedisCanvas from '../data/redis/RedisCanvas';
import allowPlace from '../data/redis/allowPlace';
import {
  setPixelByOffset,
  setPixelByCoords,
} from './setPixel';
import rankings from './ranking';
import canvases from './canvases';

import { THREE_CANVAS_HEIGHT, THREE_TILE_SIZE, TILE_SIZE } from './constants';

let coolDownFactor = 1;
export function setCoolDownFactor(fac) {
  coolDownFactor = fac;
}

/*
 * IPs who are currently requesting pixels
 * (have to log in order to avoid race conditions)
 */
const curReqIPs = new Map();
setInterval(() => {
  // clean up old data
  const ts = Date.now() - 20 * 1000;
  const ips = [...curReqIPs.keys()];
  for (let i = 0; i < ips.length; i += 1) {
    const ip = ips[i];
    const limiter = curReqIPs.get(ip);
    if (limiter && ts > limiter) {
      curReqIPs.delete(ip);
      logger.warn(
        `Pixel requests from ${ip} got stuck`,
      );
    }
  }
}, 20 * 1000);


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
  user,
  canvasId,
  i,
  j,
  pixels,
) {
  let wait = 0;
  let coolDown = 0;
  let retCode = 0;
  let pxlCnt = 0;
  let rankedPxlCnt = 0;
  let needProxycheck = 0;
  const { ip } = user;

  try {
    const startTime = Date.now();

    if (curReqIPs.has(ip)) {
      // already setting a pixel somewhere
      logger.warn(
        `Got simultanious requests from ${user.ip}`,
      );
      throw new Error(13);
    }
    curReqIPs.set(ip, startTime);

    const canvas = canvases[canvasId];
    if (!canvas) {
      // canvas doesn't exist
      throw new Error(1);
    }

    const canvasSize = canvas.size;
    const is3d = !!canvas.v;

    const tileSize = (is3d) ? THREE_TILE_SIZE : TILE_SIZE;
    /*
     * canvas/chunk validation
     */
    if (i >= canvasSize / tileSize) {
      // x out of bounds
      // (we don't have to check for <0 becaue it is received as uint)
      throw new Error(2);
    }
    if (j >= canvasSize / tileSize) {
      // y out of bounds
      // (we don't have to check for <0 becaue it is received as uint)
      throw new Error(3);
    }

    /*
     * userlvl:
     *   0: nothing
     *   1: admin
     *   2: mod
     */
    const isAdmin = (user.userlvl === 1);

    if (canvas.req !== undefined && !isAdmin) {
      if (user.id === null) {
        // not logged in
        throw new Error(6);
      }
      if (canvas.req > 0) {
        const totalPixels = await user.getTotalPixels();
        if (totalPixels < canvas.req) {
          // not enough pixels placed yet
          throw new Error(7);
        }
      }
      if (canvas.req === 'top' && !rankings.prevTop.includes(user.id)) {
        // not in top ten
        throw new Error(12);
      }
    }

    const clrIgnore = canvas.cli || 0;
    const factor = (isAdmin || (user.userlvl > 0 && pixels[0][1] < clrIgnore))
      ? 0.0 : coolDownFactor;
    const bcd = canvas.bcd * factor;
    const pcd = (canvas.pcd) ? canvas.pcd * factor : bcd;
    const pxlOffsets = [];

    /*
     * validate pixels
     */
    for (let u = 0; u < pixels.length; u += 1) {
      const [offset, color] = pixels[u];
      pxlOffsets.push(offset);

      const [x, y, z] = getPixelFromChunkOffset(i, j, offset, canvasSize, is3d);
      pixelLogger.info(
        // eslint-disable-next-line max-len
        `${startTime} ${user.ip} ${user.id} ${canvasId} ${x} ${y} ${z} ${color}`,
      );

      const maxSize = (is3d) ? tileSize * tileSize * THREE_CANVAS_HEIGHT
        : tileSize * tileSize;
      if (offset >= maxSize) {
        // z out of bounds or weird stuff
        throw new Error(4);
      }

      // admins and mods can place unset pixels
      if (color >= canvas.colors.length
        || (color < clrIgnore
          && user.userlvl === 0
          && !(canvas.v && color === 0))
      ) {
        // color out of bounds
        throw new Error(5);
      }

      /* 3D Canvas Minecraft Avatars */
      // && x >= 96 && x <= 128 && z >= 35 && z <= 100
      // 96 - 128 on x
      // 32 - 128 on z
      if (canvas.v && i === 19 && j >= 17 && j < 20 && !isAdmin) {
        // protected pixel
        throw new Error(8);
      }

      // eslint-disable-next-line eqeqeq
      if (canvas.ranked && (canvasId != 0 || y < 14450) && pcd) {
        pixels[u].push(true);
      }
    }

    [retCode, pxlCnt, wait, coolDown, needProxycheck] = await allowPlace(
      ip,
      user.id,
      canvasId,
      i, j,
      clrIgnore,
      bcd, pcd,
      canvas.cds,
      pxlOffsets,
    );

    for (let u = 0; u < pxlCnt; u += 1) {
      const [offset, color, ranked] = pixels[u];
      setPixelByOffset(canvasId, color, i, j, offset);
      if (ranked) {
        rankedPxlCnt += 1;
      }
    }

    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn(
        // eslint-disable-next-line max-len
        `Long response time of ${duration}ms for placing ${pxlCnt} pixels for user ${user.id || user.ip}`,
      );
    }
  } catch (e) {
    retCode = parseInt(e.message, 10);
    if (Number.isNaN(retCode)) {
      throw e;
    }
  }

  if (rankedPxlCnt) {
    await user.incrementPixelcount(rankedPxlCnt);
  }

  if (retCode !== 13) {
    curReqIPs.delete(ip);
  }

  return {
    wait,
    coolDown,
    pxlCnt,
    rankedPxlCnt,
    retCode,
    needProxycheck,
  };
}


/**
 *
 * Old version of draw that returns explicit error messages
 * used for http json api/pixel, used with coordinates
 * Is not used anywhere currently, but we keep it around.
 * @param user
 * @param canvasId
 * @param x
 * @param y
 * @param color
 * @returns {Promise.<Object>}
 */
export async function drawByCoords(
  user,
  canvasId,
  color,
  x,
  y,
  z = null,
) {
  const canvas = canvases[canvasId];

  if (!canvas) {
    return {
      error: 'This canvas does not exist',
      success: false,
    };
  }

  const canvasMaxXY = canvas.size / 2;
  const canvasMinXY = -canvasMaxXY;
  if (x < canvasMinXY || x >= canvasMaxXY) {
    return {
      error: 'x Coordinate not within canvas',
      success: false,
    };
  }

  const clrIgnore = canvas.cli || 0;

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
    if (color < clrIgnore) {
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
  const setColor = await RedisCanvas.getPixel(canvasId, canvas.size, x, y, z);

  /*
   * bitwise operation to get rid of protection
   */
  let coolDown = ((setColor & 0x3F) >= clrIgnore && canvas.pcd)
    ? canvas.pcd : canvas.bcd;
  if (isAdmin) {
    coolDown = 0.0;
  } else {
    coolDown *= coolDownFactor;
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
  /* hardcode to not count pixels in antarctica */
  // eslint-disable-next-line eqeqeq
  if (canvas.ranked && (canvasId != 0 || y < 14450)) {
    user.incrementPixelcount();
  }
  return {
    success: true,
    waitSeconds: waitLeft / 1000,
    coolDownSeconds: coolDown / 1000,
  };
}
