/*
 * redux store for windows / popups
 */

/* eslint-disable no-console */

import {
  applyMiddleware, createStore, compose, combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

/*
 * reducers
 */
import audio from './reducers/audio';
import canvas from './reducers/canvas';
import gui from './reducers/gui';
import win from './reducers/win';

/*
 * middleware
 */
import promise from './middleware/promise';

const CURRENT_VERSION = 3;

const reducers = persistReducer({
  key: 'primary',
  storage,
  version: CURRENT_VERSION,
  migrate: (state, version) => {
    console.log(state);
    if (version !== CURRENT_VERSION) {
      console.log('Newer version run, resetting store.');
      return Promise.resolve({});
    }
    console.log(`Store version: ${version}`);
    return Promise.resolve(state);
  },
  blacklist: [
    'canvas',
    'win',
  ],
}, combineReducers({
  audio,
  canvas,
  gui,
  win,
}));

const store = createStore(
  reducers,
  undefined,
  compose(
    applyMiddleware(
      thunk,
      promise,
    ),
  ),
);


persistStore(store);

export default store;
