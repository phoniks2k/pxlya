/*
 * redux store
 */

import {
  applyMiddleware, createStore, combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import sharedReducers, {
  CURRENT_VERSION,
  migrate,
} from './sharedReducers';

/*
 * reducers
 */
import windows from './reducers/windows';
import canvas from './reducers/canvas';
import user from './reducers/user';
import alert from './reducers/alert';
import chat from './reducers/chat';
import fetching from './reducers/fetching';

/*
 * middleware
 */
import audio from './middleware/audio';
import socketClientHook from './middleware/socketClientHook';
import rendererHook from './middleware/rendererHook';
import array from './middleware/array';
import promise from './middleware/promise';
import notifications from './middleware/notifications';
import title from './middleware/title';
import extensions from './middleware/extensions';

const windowsPersist = persistReducer({
  key: 'wind',
  storage,
  version: CURRENT_VERSION,
  migrate,
}, windows);

const reducers = combineReducers({
  ...sharedReducers,
  windows: windowsPersist,
  canvas,
  user,
  alert,
  chat,
  fetching,
});

const store = createStore(
  reducers,
  applyMiddleware(
    thunk,
    promise,
    array,
    audio,
    notifications,
    title,
    socketClientHook,
    rendererHook,
    extensions,
  ),
);


persistStore(store);

export default store;
