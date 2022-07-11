/*
 * Hooks for placePixel
 *
 */

import { requestFromQueue } from '../../ui/placePixel';

export default (store) => (next) => (action) => {
  switch (action.type) {
    case 'CLOSE_ALERT': {
      requestFromQueue(store);
      break;
    }
    default:
      // nothing
  }

  return next(action);
};
