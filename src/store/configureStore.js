import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';

import audio from './middleware/audio';
import socketClientHook from './middleware/socketClientHook';
import rendererHook from './middleware/rendererHook';
// import ads from './ads';
import array from './middleware/array';
import promise from './middleware/promise';
import notifications from './middleware/notifications';
import title from './middleware/title';
import placePixelControl from './middleware/placePixelControl';
import extensions from './middleware/extensions';
import reducers from './reducers';


const store = createStore(
  reducers,
  undefined,
  compose(
    applyMiddleware(
      thunk,
      promise,
      array,
      audio,
      notifications,
      title,
      socketClientHook,
      rendererHook,
      placePixelControl,
      extensions,
    ),
  ),
);


export default function configureStore(onComplete) {
  persistStore(store, null, () => {
    if (onComplete) {
      onComplete(store);
    }
  });
  return store;
}
