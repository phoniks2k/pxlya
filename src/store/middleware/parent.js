/*
 * send and receive actions from parent window
 */

/* eslint-disable no-console */

import { load, unload } from '../actions';

const { origin } = window.location;

window.addEventListener('beforeunload', () => {
  if (window.opener && !window.closed) {
    window.opener.postMessage(unload(), origin);
  }
});


export default (store) => (next) => (action) => {
  if (action instanceof MessageEvent) {
    if (action.origin !== origin
      || !action.data.type
    ) {
      return null;
    }
    if (action.data.type === 't/UNLOAD') {
      setTimeout(() => {
        if (!window.opener || window.opener.closed) {
          console.log('Parent window closed');
          store.dispatch({ type: 't/PARENT_CLOSED' });
        } else {
          console.log('Parent window refreshed');
          /*
           * hook to event and also send message to catch more
           * possibilities
           */
          try {
            const sendLoad = () => {
              window.opener.postMessage({ type: 't/LOAD' }, origin);
              window.opener.removeEventListener('DOMContentLoaded', sendLoad);
            };
            window.opener.addEventListener('DOMContentLoaded', sendLoad, false);
          } catch {
            console.log('Could not hook to parent window');
          }
          window.opener.postMessage({ type: 't/LOAD' }, origin);
        }
      }, 3000);
    }
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
