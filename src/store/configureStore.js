import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistCombineReducers } from 'redux-persist';
import localForage from 'localforage';

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
import placePixelControl from './middleware/placePixelControl';
import extensions from './middleware/extensions';

const reducers = persistCombineReducers({
  key: 'primary',
  storage: localForage,
  blacklist: [
    'user',
    'canvas',
    'alert',
    'chat',
    'contextMenu',
    'fetching',
  ],
}, {
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
});

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
      placePixelControl,
      extensions,
    ),
  ),
);


persistStore(store);

export default store;
