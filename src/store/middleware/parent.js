/*
 * send and receive actions from parent window
 */

const BLACKLIST = [
  'SET_HOVER',
  'UNSET_HOVER',
  'SET_SCALE',
  'SET_VIEW_COORDINATES',
];
const { origin } = window.location;

export default () => (next) => (action) => {
  if (action instanceof MessageEvent) {
    if (action.origin !== origin) {
      return null;
    }
    return next(action.data);
  }

  if (window.opener
    && !window.opener.closed
    && !BLACKLIST.includes(action.type)
  ) {
    try {
      window.opener.postMessage(action, origin);
    } catch {
      // nothing
    }
  }

  return next(action);
};
