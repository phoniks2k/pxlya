/*
 * sends events via window.pixelPlanetEvents to potential
 * Extensions and Userscripts
 *
 * @flow
 */

import EventEmitter from 'events';

const pixelPlanetEvents = new EventEmitter();

export default () => (next) => (action) => {
  switch (action.type) {
    case 'SELECT_CANVAS': {
      const { canvasId } = action;
      pixelPlanetEvents.emit('selectcanvas', canvasId);
      break;
    }

    case 'SET_VIEW_COORDINATES': {
      const { view } = action;
      pixelPlanetEvents.emit('setviewcoordinates', view);
      break;
    }

    case 'RECEIVE_BIG_CHUNK': {
      const { center, chunk } = action;
      pixelPlanetEvents.emit('receivechunk', center, chunk);
      break;
    }

    case 'RECEIVE_PIXEL_UPDATE': {
      const {
        i, j, offset, color,
      } = action;
      pixelPlanetEvents.emit('pixelupdate', i, j, offset, color);
      break;
    }

    case 'RECEIVE_ME': {
      const { canvases } = action;
      pixelPlanetEvents.emit('getcanvases', canvases);
      break;
    }

    default:
      // nothing
  }

  return next(action);
};

window.pixelPlanetEvents = pixelPlanetEvents;
