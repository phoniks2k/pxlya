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
      pixelPlanetEvents.emit('selectcanvas', action.canvasId);
      break;
    }

    case 'SET_VIEW_COORDINATES': {
      /*
       * view: [x, y] canvas coordinates of the center of the screen
       */
      pixelPlanetEvents.emit('setviewcoordinates', action.view);
      break;
    }

    case 'SET_HOVER': {
      /*
       * hover: [x, y] canvas coordinates of cursor
       * just used on 2D canvas
       */
      pixelPlanetEvents.emit('sethover', action.hover);
      break;
    }

    case 'RECEIVE_BIG_CHUNK': {
      /*
       * center: Array with [zoom, x, y] on 2D and [0, x, z] on 3D canvas
       * chunk: ChunkRGB or ChunkRGB3D object,
       *        see ui/ChunkRGB.js and ui/ChunkRGB3D.js
       */
      const { center, chunk } = action;
      pixelPlanetEvents.emit('receivechunk', center, chunk);
      break;
    }

    case 'RECEIVE_PIXEL_UPDATE': {
      /*
       * i, j: chunk coordinates
       * offset: position of pixel within chunk
       * color: color index
       */
      const {
        i, j, offset, color,
      } = action;
      pixelPlanetEvents.emit('pixelupdate', i, j, offset, color);
      break;
    }

    default:
      // nothing
  }

  return next(action);
};

window.pixelPlanetEvents = pixelPlanetEvents;
