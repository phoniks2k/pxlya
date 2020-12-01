/* @flow */

import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';

import audio from './audio';
import swal from './sweetAlert';
import protocolClientHook from './protocolClientHook';
import rendererHook from './rendererHook';
// import ads from './ads';
import array from './array';
import promise from './promise';
import notifications from './notifications';
import title from './title';
import extensions from './extensions';
import reducers from '../reducers';


const store = createStore(
  reducers,
  undefined,
  compose(
    applyMiddleware(
      thunk,
      promise,
      array,
      swal,
      audio,
      notifications,
      title,
      protocolClientHook,
      rendererHook,
      extensions,
    ),
  ),
);


export default function configureStore(onComplete: ?() => void) {
  persistStore(store, null, () => {
    onComplete(store);
  });
  if (isDebuggingInChrome) {
    window.store = store;
  }
  return store;
}
