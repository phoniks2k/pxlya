/*
 * redux store
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
import windows from './reducers/windows';
import user from './reducers/user';
import ranks from './reducers/ranks';
import alert from './reducers/alert';
import chat from './reducers/chat';
import contextMenu from './reducers/contextMenu';
import chatRead from './reducers/chatRead';
import fetching from './reducers/fetching';

/*
 * middleware
 */
import audiom from './middleware/audio';
import socketClientHook from './middleware/socketClientHook';
import rendererHook from './middleware/rendererHook';
// import ads from './ads';
import array from './middleware/array';
import promise from './middleware/promise';
import notifications from './middleware/notifications';
import title from './middleware/title';
// import placePixelControl from './middleware/placePixelControl';
import extensions from './middleware/extensions';

const CURRENT_VERSION = 3;

const reducers = persistReducer({
  key: 'primary',
  storage,
  version: CURRENT_VERSION,
  migrate: (state, version) => {
    if (version !== CURRENT_VERSION) {
      console.log('Newer version run, resetting store.');
      return Promise.resolve({});
    }
    console.log(`Store version: ${version}`);
    return Promise.resolve(state);
  },
  blacklist: [
    'user',
    'canvas',
    'alert',
    'chat',
    'contextMenu',
    'fetching',
  ],
}, combineReducers({
  audio,
  canvas,
  gui,
  windows,
  user,
  ranks,
  alert,
  chat,
  contextMenu,
  chatRead,
  fetching,
}));

const store = createStore(
  reducers,
  undefined,
  compose(
    applyMiddleware(
      thunk,
      promise,
      array,
      audiom,
      notifications,
      title,
      socketClientHook,
      rendererHook,
      // placePixelControl,
      extensions,
    ),
  ),
);


persistStore(store);

export default store;
