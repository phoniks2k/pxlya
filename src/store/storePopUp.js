/*
 * redux store for popups
 */

/* eslint-disable no-console */

import {
  applyMiddleware, createStore, combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';

/*
 * reducers
 */
import sharedReducers from './sharedReducers';
import canvas from './reducers/canvas';
import popup from './reducers/popup';

/*
 * middleware
 */
import parent from './middleware/parent';

const reducers = combineReducers({
  ...sharedReducers,
  canvas,
  popup,
});

const store = createStore(
  reducers,
  applyMiddleware(
    thunk,
    parent,
  ),
);

export const persistor = persistStore(store, {}, () => {
  window.addEventListener('message', store.dispatch);
  store.dispatch({ type: 'HYDRATED' });
});

export default store;
