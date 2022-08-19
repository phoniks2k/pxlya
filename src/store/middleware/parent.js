/*
 * send and receive actions from parent window
 */
import { load, unload } from '../actions';

const { origin } = window.location;

window.addEventListener('beforeunload', () => {
  if (window.opener && !window.closed) {
    window.opener.postMessage(unload(), origin);
  }
});


export default () => (next) => (action) => {
  if (action instanceof MessageEvent) {
    if (action.origin !== origin) {
      return null;
    }
    if (action.data.type === 't/UNLOAD') {
      return null;
    }
    console.log('GOT', action.data);
    return next(action.data);
  }

  if (window.opener
    && !window.opener.closed
    && action.type
  ) {
    if (action.type === 'HYDRATED') {
      window.opener.postMessage(load(), origin);
    } else if (action.type.startsWith('s/')) {
      try {
        window.opener.postMessage(action, origin);
      } catch {
        // nothing
      }
    }
  }

  return next(action);
};
