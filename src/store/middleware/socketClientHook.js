/*
 * Hooks for websocket client to store changes
 *
 */

import SocketClient from '../../socket/SocketClient';

export default (store) => (next) => (action) => {
  switch (action.type) {
    case 'REC_BIG_CHUNK':
    case 'REC_BIG_CHUNK_FAILURE': {
      if (!action.center) {
        break;
      }
      const [, cx, cy] = action.center;
      SocketClient.registerChunk([cx, cy]);
      break;
    }

    case 'SET_NAME':
    case 'LOGIN':
    case 'LOGOUT': {
      SocketClient.reconnect();
      break;
    }

    default:
    // nothing
  }

  const ret = next(action);

  // executed after reducers
  switch (action.type) {
    case 'RELOAD_URL':
    case 'SELECT_CANVAS':
    case 'REC_ME': {
      const state = store.getState();
      const { canvasId } = state.canvas;
      SocketClient.setCanvas(canvasId);
      break;
    }

    default:
    // nothing
  }

  return ret;
};
