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
import promise from './middleware/promise';

const reducers = combineReducers({
  ...sharedReducers,
  canvas,
  win,
});

const store = createStore(
  reducers,
  applyMiddleware(
    thunk,
    promise,
  ),
);


export const persistor = persistStore(store);

export default store;
