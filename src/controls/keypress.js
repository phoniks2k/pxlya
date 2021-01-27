/*
 * keypress actions
 * @flow
 */
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


function onKeyPress(event: KeyboardEvent) {
  // ignore key presses if modal is open or chat is used
  if (event.target.nodeName === 'INPUT'
    || event.target.nodeName === 'TEXTAREA'
  ) {
    return;
  }

  switch (event.key) {
    case 'g':
      store.dispatch(toggleGrid());
      break;
    case 'h':
      store.dispatch(toggleHistoricalView());
      break;
    case 'x':
      store.dispatch(togglePixelNotify());
      break;
    case 'm':
      store.dispatch(toggleMute());
      break;
    case 'r': {
      const state = store.getState();
      const { hover } = state.gui;
      const text = hover.join('_');
      copy(text);
      store.dispatch(notify('Copied!'));
      break;
    }
    case 'p': {
      store.dispatch(toggleHiddenCanvases());
      break;
    }
    default:
  }
}

export default onKeyPress;
