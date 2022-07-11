/*
 * consume async function as action
 */

function warn(error) {
  // eslint-disable-next-line no-console
  console.warn(error.message || error);
  throw error; // To let the caller handle the rejection
}

export default () => (next) => (action) => (typeof action.then === 'function'
  ? Promise.resolve(action).then(next, warn)
  : next(action));
