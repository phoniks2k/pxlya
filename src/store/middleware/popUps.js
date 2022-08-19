/*
 * send and receive actions from popups
 */
import popUps from '../../core/popUps';

const BLACKLIST = [
  'SET_HOVER',
  'UNSET_HOVER',
  'SET_SCALE',
  'SET_VIEW_COORDINATES',
];

export default () => (next) => (action) => {
  if (action instanceof MessageEvent) {
    if (action.origin !== window.location.origin) {
      return null;
    }
    return next(action.data);
  }

  if (popUps.wins.length
    && !BLACKLIST.includes(action.type)
    && action.type.indexOf('WIN') === -1
  ) {
    popUps.dispatch(action);
  }

  return next(action);
};
