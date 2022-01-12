/*
 * keypress actions
 * @flow
 */
import { t } from 'ttag';
import store from '../ui/store';
import copy from '../utils/clipboard';
import {
  toggleGrid,
  toggleHistoricalView,
  toggleHiddenCanvases,
  togglePixelNotify,
  toggleMute,
  notify,
  selectCanvas,
} from '../actions';

const usedKeys = ['g', 'h', 'x', 'm', 'r', 'p'];

function onKeyPress(event: KeyboardEvent) {
  // ignore key presses if modal is open or chat is used
  if (event.target.nodeName === 'INPUT'
    || event.target.nodeName === 'TEXTAREA'
  ) {
    return;
  }

  let { key } = event;

  const num = Number(key);
  if (!Number.isNaN(num) && num > 0) {
    // switch to canvas on num keys
    const { canvases, canvasId: curCanvasId } = store.getState().canvas;
    const canvasIds = Object.keys(canvases).filter((id) => !canvases[id].hid);
    if (num <= canvasIds.length) {
      const canvasId = canvasIds[num - 1];
      // eslint-disable-next-line eqeqeq
      if (canvasId != curCanvasId) {
        store.dispatch(selectCanvas(canvasId));
        const canvasName = canvases[canvasId].title;
        store.dispatch(notify(t`Switched to ${canvasName}`));
      }
    }
    return;
  }

  /*
   * if char of key isn't used by a keybind,
   * we check if the key location is where a
   * key that is used would be on QWERTY
   */
  if (!usedKeys.includes(key)) {
    key = event.code;
    if (!key.startsWith('Key')) {
      return;
    }
    key = key.slice(-1).toLowerCase();
  }

  switch (key) {
    case 'g':
      store.dispatch(toggleGrid());
      store.dispatch(notify((store.getState().gui.showGrid)
        ? t`Grid ON`
        : t`Grid OFF`));
      return;
    case 'h':
      if (window.ssv && window.ssv.backupurl) {
        store.dispatch(toggleHistoricalView());
      }
      return;
    case 'x':
      store.dispatch(togglePixelNotify());
      store.dispatch(notify((store.getState().gui.showPixelNotify)
        ? t`Pixel Notify ON`
        : t`Pixel Notify OFF`));
      return;
    case 'm':
      store.dispatch(toggleMute());
      store.dispatch(notify((store.getState().audio.mute)
        ? t`Muted Sound`
        : t`Unmuted Sound`));
      return;
    case 'r': {
      const { hover } = store.getState().gui;
      const text = hover.join('_');
      copy(text);
      store.dispatch(notify(t`Copied!`));
      return;
    }
    case 'p':
      store.dispatch(toggleHiddenCanvases());
      store.dispatch(notify((store.getState().canvas.showHiddenCanvases)
        ? t`Show Hidden Canvases`
        : t`Hide Hidden Canvases`));
      break;
    default:
  }
}

export default onKeyPress;
