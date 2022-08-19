/*
 * redux store for windows / popups
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
import win from './reducers/win';

/*
 * middleware
 */
import parent from './middleware/parent';

const reducers = combineReducers({
  ...sharedReducers,
  canvas,
  win,
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
