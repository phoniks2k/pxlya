
import {
  TILE_SIZE,
  THREE_TILE_SIZE,
  TILE_ZOOM_LEVEL,
} from './constants';

/**
 * http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
 * @param n
 * @param m
 * @returns {number} remainder
 */
export function mod(n, m) {
  return ((n % m) + m) % m;
}

/*
 * returns random integer
 * @param min Minimum of random integer
 * @param max Maximum of random integer
 * @return random integer between min and max (min <= ret <= max)
 */
export function getRandomInt(min, max) {
  const range = max - min + 1;
  return min + (Math.floor(Math.random() * range));
}

/*
 * generates random string with a-z,0-9
 * 11 chars length
 */
export function getRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

export function distMax([x1, y1], [x2, y2]) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

/*
 * convert YYYY-MM-DD to YYYYMMDD
 */
export function dateToString(date) {
  // YYYY-MM-DD
  return date.substring(0, 4) + date.substring(5, 7) + date.substring(8);
}

/*
 * get current date in YYYY-MM-DD
 */
export function getToday() {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  return `${date.getFullYear()}-${month}-${day}`;
}

// z is assumed to be height here
// in ui and rendeer, y is height
export function getChunkOfPixel(
  canvasSize,
  x,
  y,
  z = null,
) {
  const tileSize = (z === null) ? TILE_SIZE : THREE_TILE_SIZE;
  const width = (z == null) ? y : z;
  const cx = Math.floor((x + (canvasSize / 2)) / tileSize);
  const cy = Math.floor((width + (canvasSize / 2)) / tileSize);
  return [cx, cy];
}

export function getTileOfPixel(
  tileScale,
  pixel,
  canvasSize = null,
) {
  const target = pixel.map(
    (x) => Math.floor((x + canvasSize / 2) / TILE_SIZE * tileScale),
  );
  return target;
}

export function getMaxTiledZoom(canvasSize) {
  if (!canvasSize) return 0;
  return Math.log2(canvasSize / TILE_SIZE) / TILE_ZOOM_LEVEL * 2;
}

export function getHistoricalCanvasSize(
  historicalDate,
  canvasSize,
  historicalSizes,
) {
  if (historicalDate && historicalSizes) {
    let i = historicalSizes.length;
    while (i > 0) {
      i -= 1;
      const [date, size] = historicalSizes[i];
      if (historicalDate <= date) {
        return size;
      }
    }
  }
  return canvasSize;
}

export function getCanvasBoundaries(canvasSize) {
  const canvasMinXY = -canvasSize / 2;
  const canvasMaxXY = canvasSize / 2 - 1;
  return [canvasMinXY, canvasMaxXY];
}

// z is assumed to be height here
// in ui and rendeer, y is height
export function getOffsetOfPixel(
  canvasSize,
  x,
  y,
  z = null,
) {
  const tileSize = (z === null) ? TILE_SIZE : THREE_TILE_SIZE;
  const width = (z == null) ? y : z;
  let offset = (z === null) ? 0 : (y * tileSize * tileSize);
  const modOffset = mod((canvasSize / 2), tileSize);
  const cx = mod(x + modOffset, tileSize);
  const cy = mod(width + modOffset, tileSize);
  offset += (cy * tileSize) + cx;
  return offset;
}

/*
 * Searches Object for element with ident string and returns its key
 * Used for getting canvas id from given ident-string (see canvases.json)
 * @param obj Object
 * @param ident ident string
 * @return key
 */
export function getIdFromObject(obj, ident) {
  const ids = Object.keys(obj);
  for (let i = 0; i < ids.length; i += 1) {
    const key = ids[i];
    if (obj[key].ident === ident) {
      return parseInt(key, 10);
    }
  }
  return null;
}

// z is returned as height here
// in ui and rendeer, y is height
export function getPixelFromChunkOffset(
  i,
  j,
  offset,
  canvasSize,
  is3d: boolean = false,
) {
  const tileSize = (is3d) ? THREE_TILE_SIZE : TILE_SIZE;
  const cx = offset % tileSize;
  const off = offset - cx;
  let cy = off % (tileSize * tileSize);
  const z = (is3d) ? (off - cy) / tileSize / tileSize : null;
  cy /= tileSize;

  const devOffset = canvasSize / 2 / tileSize;
  const x = ((i - devOffset) * tileSize) + cx;
  const y = ((j - devOffset) * tileSize) + cy;
  return [x, y, z];
}

export function getCellInsideChunk(
  canvasSize,
  pixel,
) {
  return pixel.map((x) => mod(x + canvasSize / 2, TILE_SIZE));
}

export function screenToWorld(
  state,
  $viewport,
  [x, y],
) {
  const { view, viewscale } = state.canvas;
  const [viewX, viewY] = view;
  const { width, height } = $viewport;
  return [
    Math.floor(((x - (width / 2)) / viewscale) + viewX),
    Math.floor(((y - (height / 2)) / viewscale) + viewY),
  ];
}

export function worldToScreen(
  state,
  $viewport,
  [x, y],
) {
  const { view, viewscale } = state.canvas;
  const [viewX, viewY] = view;
  const { width, height } = $viewport;
  return [
    ((x - viewX) * viewscale) + (width / 2),
    ((y - viewY) * viewscale) + (height / 2),
  ];
}

export function durationToString(
  ms,
  smallest: boolean = false,
) {
  const seconds = Math.ceil(ms / 1000);
  let timestring;
  if (seconds < 60 && smallest) {
    timestring = seconds;
  } else {
    // eslint-disable-next-line max-len
    timestring = `${Math.floor(seconds / 60)}:${(`0${seconds % 60}`).slice(-2)}`;
  }
  return timestring;
}

const postfix = ['k', 'M', 'B'];
export function numberToString(num) {
  if (!num) {
    return 'N/A';
  }
  if (num < 1000) {
    return num;
  }
  let postfixNum = 0;
  while (postfixNum < postfix.length) {
    if (num < 10000) {
      // eslint-disable-next-line max-len
      return `${Math.floor(num / 1000)}.${(`0${Math.floor((num % 1000) / 10)}`).slice(-2)}${postfix[postfixNum]}`;
    } if (num < 100000) {
      // eslint-disable-next-line max-len
      return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 100)}${postfix[postfixNum]}`;
    } if (num < 1000000) {
      return Math.floor(num / 1000) + postfix[postfixNum];
    }
    postfixNum += 1;
    num = Math.round(num / 1000);
  }
  return '';
}

export function numberToStringFull(num) {
  if (num < 0) {
    return `${num} :-(`;
  } if (num < 1000) {
    return num;
  } if (num < 1000000) {
    return `${Math.floor(num / 1000)}.${(`00${String(num % 1000)}`).slice(-3)}`;
  }

  // eslint-disable-next-line max-len
  return `${Math.floor(num / 1000000)}.${(`00${String(Math.floor(num / 1000))}`).slice(-3)}.${(`00${String(num % 1000)}`).slice(-3)}`;
}

/*
 * generates a color based on a given string
 */
export function colorFromText(str) {
  if (!str) return '#000000';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
}

/*
 * sets a color into bright or dark mode
 */
export function setBrightness(hex, dark: boolean = false) {
  hex = hex.replace(/^\s*#|\s*$/g, '');

  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }

  let r = Math.floor(parseInt(hex.substring(0, 2), 16) / 2);
  let g = Math.floor(parseInt(hex.substring(2, 4), 16) / 2);
  let b = Math.floor(parseInt(hex.substring(4, 6), 16) / 2);
  if (dark) {
    r += 128;
    g += 128;
    b += 128;
  }
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

/*
 * escape string for use in regexp
 * @param string input string
 * @return escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/*
 * create RegExp to search for ping in chat messages
 * @param name name
 * @return regular expression to search for name in message
 */
export function createNameRegExp(name) {
  if (!name) return null;
  return new RegExp(`(^|\\s+)(@${escapeRegExp(name)})(\\s+|$)`, 'g');
}

/*
 * check if webGL2 is available
 * @return boolean true if available
 */
export function isWebGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}
