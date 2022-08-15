/*
 * Place pixel via Websocket
 * Always just one pixelrequest, queue additional requests to send later
 * Pixels get predicted on the client and reset if server refused
 *
 * TODO move stuff out of here and to actions / middleware
 * clientPredictions could be in rendererHook
 *
 * */
import { t } from 'ttag';
import {
  setAllowSettingPixel,
  pAlert,
  storeReceivePixelReturn,
} from '../store/actions';
import {
  notify,
} from '../store/actions/thunks';
import SocketClient from '../socket/SocketClient';

let pixelTimeout = null;
/*
 * cache of pixels that still are to set
 * [{i: i, j: j, pixels: [[offset, color],...]}, ...]
 */
let pixelQueue = [];
/*
 * requests that got predicted on client and yet have to be
 * received from the server
 * [[i, j, offset, colorold, colornew], ...]
 */
let clientPredictions = [];
/*
 * values of last request
 * {i: i, j: j, pixels: [[offset, color], ...}
 */
let lastRequestValues = {};

/*
 * request pixel placement from queue
 */
function requestFromQueue(store) {
  if (!pixelQueue.length) {
    pixelTimeout = null;
    return;
  }

  /* timeout to warn user when Websocket is dysfunctional */
  pixelTimeout = setTimeout(() => {
    pixelQueue = [];
    pixelTimeout = null;
    store.dispatch(setAllowSettingPixel(true));
    store.dispatch(pAlert(
      t`Error :(`,
      t`Didn't get an answer from pixelplanet. Maybe try to refresh?`,
      'error',
    ));
  }, 15000);

  lastRequestValues = pixelQueue.shift();
  const { i, j, pixels } = lastRequestValues;
  SocketClient.requestPlacePixels(i, j, pixels);
  store.dispatch(setAllowSettingPixel(false));
}

/*
 * got pixel update from websocket
 */
export function receivePixelUpdate(
  renderer,
  i,
  j,
  offset,
  color,
) {
  for (let p = 0; p < clientPredictions.length; p += 1) {
    const predPxl = clientPredictions[p];
    if (predPxl[0] === i
      && predPxl[1] === j
      && predPxl[2] === offset
    ) {
      if (predPxl[4] === color) {
        clientPredictions.splice(p, 1);
      }
      return;
    }
  }
  renderer.renderPixel(i, j, offset, color, true);
}

/*
 * Revert predictions starting at given pixel
 * @param i, j, offset data of the first pixel that got rejected
 */
function revertPredictionsAt(
  renderer,
  sI,
  sJ,
  sOffset,
) {
  let p = 0;
  while (p < clientPredictions.length) {
    const predPxl = clientPredictions[p];
    if (predPxl[0] === sI
      && predPxl[1] === sJ
      && predPxl[2] === sOffset
    ) {
      break;
    }
    p += 1;
  }

  if (p >= clientPredictions.length) {
    clientPredictions = [];
    return;
  }

  while (p < clientPredictions.length) {
    const [i, j, offset, color] = clientPredictions[p];
    renderer.renderPixel(i, j, offset, color, false);
    p += 1;
  }

  clientPredictions = [];
}

/*
 * try to place a pixel
 */
export function tryPlacePixel(
  renderer,
  store,
  i,
  j,
  offset,
  color,
  curColor,
) {
  renderer.renderPixel(i, j, offset, color, false);
  clientPredictions.push([i, j, offset, curColor, color]);

  if (pixelQueue.length) {
    const lastReq = pixelQueue[pixelQueue.length - 1];
    const { i: lastI, j: lastJ } = lastReq;
    if (i === lastI && j === lastJ) {
      /* append to last request in queue if same chunk */
      lastReq.pixels.push([offset, color]);
    }
    return;
  }

  pixelQueue.push({
    i,
    j,
    pixels: [[offset, color]],
  });

  if (!pixelTimeout) {
    requestFromQueue(store);
  }
}

/*
 * got return from pixel request
 */
export function receivePixelReturn(
  store,
  renderer,
  args,
) {
  clearTimeout(pixelTimeout);

  store.dispatch(storeReceivePixelReturn(args));

  const {
    retCode,
    coolDownSeconds,
    pxlCnt,
  } = args;

  if (coolDownSeconds) {
    store.dispatch(notify(coolDownSeconds));
  }

  if (retCode) {
    /*
     * one or more pixels didn't get set,
     * revert predictions and clean queue
     */
    const { i, j, pixels } = lastRequestValues;
    const [offset] = pixels[pxlCnt];
    revertPredictionsAt(renderer, i, j, offset);
    pixelQueue = [];
  }

  let errorTitle = null;
  let msg = null;
  let type = 'error';
  switch (retCode) {
    case 0:
      break;
    case 1:
      errorTitle = t`Invalid Canvas`;
      msg = t`This canvas doesn't exist`;
      break;
    case 2:
      errorTitle = t`Invalid Coordinates`;
      msg = t`x out of bounds`;
      break;
    case 3:
      errorTitle = t`Invalid Coordinates`;
      msg = t`y out of bounds`;
      break;
    case 4:
      errorTitle = t`Invalid Coordinates`;
      msg = t`z out of bounds`;
      break;
    case 5:
      errorTitle = t`Wrong Color`;
      msg = t`Invalid color selected`;
      break;
    case 6:
      errorTitle = t`Just for registered Users`;
      msg = t`You have to be logged in to place on this canvas`;
      break;
    case 7:
      errorTitle = t`Place more :)`;
      // eslint-disable-next-line max-len
      msg = t`You can not access this canvas yet. You need to place more pixels`;
      break;
    case 8:
      store.dispatch(notify(t`Pixel protected!`));
      break;
    case 9:
      // pixestack used up
      break;
    case 10:
      errorTitle = 'Captcha';
      msg = t`Please prove that you are human`;
      type = 'captcha';
      break;
    case 11:
      errorTitle = t`No Proxies Allowed :(`;
      msg = t`You are using a Proxy.`;
      break;
    case 12:
      errorTitle = t`Not allowed`;
      msg = t`Just the Top10 of yesterday can place here`;
      break;
    case 13:
      errorTitle = t`You are weird`;
      // eslint-disable-next-line max-len
      msg = t`Server got confused by your pixels. Are you playing on multiple devices?`;
      break;
    case 14:
      errorTitle = t`Banned`;
      type = 'ban';
      break;
    case 15:
      errorTitle = t`Range Banned`;
      msg = t`Your Internet Provider is banned from playing this game`;
      break;
    default:
      errorTitle = t`Weird`;
      msg = t`Couldn't set Pixel`;
  }

  if (msg || errorTitle) {
    store.dispatch(pAlert(
      (errorTitle || t`Error ${retCode}`),
      msg,
      type,
    ));
  }

  requestFromQueue(store);
}

