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
} from '../actions';

const usedKeys = ['g', 'h', 'x', 'm', 'r', 'p'];

function onKeyPress(event: KeyboardEvent) {
  // ignore key presses if modal is open or chat is used
  if (event.target.nodeName === 'INPUT'
    || event.target.nodeName === 'TEXTAREA'
  ) {
    return;
  }

  /*
   * if char of key isn't used by a keybind,
   * we check if the key location is where a
   * key that is used would be on QWERTY
   */
  let { key } = event;
  if (!usedKeys.includes(key)) {
    key = event.code;
    if (!key.startsWith('Key')) {
      return;
    }
    key = key.substr(-1).toLowerCase();
  }

  switch (key) {
    case 'g':
      store.dispatch(toggleGrid());
      return;
    case 'h':
      store.dispatch(toggleHistoricalView());
      return;
    case 'x':
      store.dispatch(togglePixelNotify());
      return;
    case 'm':
      store.dispatch(toggleMute());
      return;
    case 'r': {
      const state = store.getState();
      const { hover } = state.gui;
      const text = hover.join('_');
      copy(text);
      store.dispatch(notify(t`Copied!`));
      return;
    }
    case 'p':
      store.dispatch(toggleHiddenCanvases());
      break;
    default:
  }
}

export default onKeyPress;
