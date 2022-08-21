/*
 * send and receive actions from popups
 */
import { propagateMe } from '../actions';
import popUps from '../../core/popUps';

export default (store) => (next) => (action) => {
  if (action instanceof MessageEvent) {
    if (action.origin !== window.location.origin) {
      return null;
    }
    if (action.data.type === 't/UNLOAD') {
      console.log('popup closed');
      popUps.remove(action.source);
    } else if (action.data.type === 't/LOAD') {
      const state = store.getState();
      action.source.postMessage(
        propagateMe(state),
        window.location.origin,
      );
      popUps.add(action.source);
      console.log('popup added');
    }
    return next(action.data);
  }

  if (popUps.wins.length
    && action.type
    && action.type.startsWith('s/')
  ) {
    popUps.dispatch(action);
  }

  console.log(action);
  return next(action);
};
