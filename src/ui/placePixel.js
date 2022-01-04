/*
 * Place pixel via Websocket
 * Always just one pixelrequest, queue additional requests to send later
 * Pixels get predicted on the client and reset if server refused
 *
 * @flow
 * */
import { t } from 'ttag';
import {
  notify,
  setRequestingPixel,
  sweetAlert,
  gotCoolDownDelta,
  pixelFailure,
  setWait,
  placedPixels,
  pixelWait,
  updatePixel,
} from '../actions';
import ProtocolClient from '../socket/ProtocolClient';

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


export function requestFromQueue(store) {
  if (!pixelQueue.length) {
    pixelTimeout = null;
    return;
  }

  /* timeout to warn user when Websocket is dysfunctional */
  pixelTimeout = setTimeout(() => {
    pixelQueue = [];
    pixelTimeout = null;
    store.dispatch(setRequestingPixel(true));
    store.dispatch(sweetAlert(
      t`Error :(`,
      t`Didn't get an answer from pixelplanet. Maybe try to refresh?`,
      'error',
      t`OK`,
    ));
  }, 5000);

  lastRequestValues = pixelQueue.shift();
  const { i, j, pixels } = lastRequestValues;
  ProtocolClient.requestPlacePixels(i, j, pixels);
  store.dispatch(setRequestingPixel(false));
}

export function receivePixelUpdate(
  store,
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
  store.dispatch(updatePixel(i, j, offset, color));
}

/*
 * Revert predictions starting at given pixel
 * @param i, j, offset data of the first pixel that got rejected
 */
function revertPredictionsAt(
  store,
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
    store.dispatch(updatePixel(i, j, offset, color, false));
    p += 1;
  }

  clientPredictions = [];
}

export function tryPlacePixel(
  store,
  i,
  j,
  offset,
  color,
  curColor,
) {
  store.dispatch(updatePixel(i, j, offset, color, false));
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

export function receivePixelReturn(
  store,
  retCode,
  wait,
  coolDownSeconds,
  pxlCnt,
) {
  clearTimeout(pixelTimeout);

  /*
   * the terms coolDown is used in a different meaning here
   * coolDown is the delta seconds  of the placed pixel
   */
  if (wait) {
    store.dispatch(setWait(wait));
  }
  if (coolDownSeconds) {
    store.dispatch(notify(coolDownSeconds));
    if (coolDownSeconds < 0) {
      store.dispatch(gotCoolDownDelta(coolDownSeconds));
    }
  }

  if (retCode) {
    /*
     * one or more pixels didn't get set,
     * revert predictions and clean queue
     */
    const { i, j, pixels } = lastRequestValues;
    const [offset] = pixels[pxlCnt];
    revertPredictionsAt(store, i, j, offset);
    pixelQueue = [];
  }

  let errorTitle = null;
  let msg = null;
  switch (retCode) {
    case 0:
      store.dispatch(placedPixels(pxlCnt));
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
      store.dispatch(pixelWait());
      break;
    case 10:
      store.dispatch(sweetAlert(
        'Captcha',
        t`Please prove that you are human`,
        'captcha',
        t`OK`,
      ));
      store.dispatch(setRequestingPixel(true));
      return;
    case 11:
      errorTitle = t`No Proxies Allowed :(`;
      msg = t`You are using a Proxy.`;
      break;
    default:
      errorTitle = t`Weird`;
      msg = t`Couldn't set Pixel`;
  }

  if (msg) {
    store.dispatch(pixelFailure());
    store.dispatch(sweetAlert(
      (errorTitle || t`Error ${retCode}`),
      msg,
      'error',
      t`OK`,
    ));
  }

  store.dispatch(setRequestingPixel(true));
  /* start next request if queue isn't empty */
  requestFromQueue(store);
}

