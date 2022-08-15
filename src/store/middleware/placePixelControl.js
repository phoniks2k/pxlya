/*
 * Hooks for placePixel
 *
 */

import { getRenderer } from '../../ui/renderer';
import { receivePixelReturn } from '../../ui/placePixel';

export default (store) => (next) => (action) => {
  const ret = next(action);

  switch (action.type) {
    case 'REC_PIXEL_RETURN': {
      const renderer = getRenderer();
      const {
        retCode,
        wait,
        coolDownSeconds,
        pxlCnt,
        rankedPxlCnt,
      } = action;
      receivePixelReturn(
        store,
        renderer,
        retCode,
        wait,
        coolDownSeconds,
        pxlCnt,
        rankedPxlCnt,
      );
      break;
    }
    default:
      // nothing
  }

  return ret;
};
