/*
 * Hooks for renderer
 *
 * @flow
 */

import {
  getRenderer,
  initRenderer,
} from '../ui/renderer';

export default (store) => (next) => (action) => {
  const { type } = action;

  let prevScale = null;

  switch (type) {
    case 'SET_SCALE': {
      const state = store.getState();
      prevScale = state.canvas.viewscale;
      break;
    }

    case 'SET_HISTORICAL_TIME': {
      const state = store.getState();
      const renderer = getRenderer();
      const {
        historicalDate: oldDate,
        historicalTime: oldTime,
      } = state.canvas;
      renderer.updateOldHistoricalTime(
        oldDate,
        oldTime,
      );
      break;
    }

    default:
      // nothing
  }

  // executed after reducers
  const ret = next(action);

  const state = store.getState();

  switch (type) {
    case 'RELOAD_URL':
    case 'SELECT_CANVAS':
    case 'RECEIVE_ME': {
      const renderer = getRenderer();
      const { is3D } = state.canvas;
      if (is3D === renderer.is3D) {
        renderer.updateCanvasData(state);
      } else {
        initRenderer(store, is3D);
      }
      break;
    }

    case 'SET_HISTORICAL_TIME': {
      const {
        historicalDate,
        historicalTime,
        historicalCanvasSize,
      } = state.canvas;
      const renderer = getRenderer();
      renderer.updateHistoricalTime(
        historicalDate,
        historicalTime,
        historicalCanvasSize,
      );
      break;
    }

    case 'REQUEST_BIG_CHUNK':
    case 'PRE_LOADED_BIG_CHUNK':
    case 'RECEIVE_BIG_CHUNK':
    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      const renderer = getRenderer();
      renderer.forceNextRender = true;
      break;
    }

    case 'TOGGLE_GRID':
    case 'SET_REQUESTING_PIXEL': {
      const renderer = getRenderer();
      renderer.forceNextSubrender = true;
      break;
    }

    case 'TOGGLE_HISTORICAL_VIEW':
    case 'SET_SCALE': {
      const renderer = getRenderer();
      renderer.updateScale(state, prevScale);
      break;
    }

    case 'UPDATE_PIXEL': {
      const {
        i,
        j,
        offset,
        color,
      } = action;
      const renderer = getRenderer();
      renderer.renderPixel(i, j, offset, color);
      break;
    }

    case 'SET_VIEW_COORDINATES': {
      const renderer = getRenderer();
      renderer.updateView(state);
      break;
    }

    case 'COOLDOWN_DELTA': {
      const { delta } = action;
      const renderer = getRenderer();
      if (renderer && renderer.controls && renderer.controls.gotCoolDownDelta) {
        renderer.controls.gotCoolDownDelta(delta * -1);
      }
      break;
    }

    default:
      // nothing
  }

  return ret;
};
