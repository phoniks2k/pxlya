/* @flow */

import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';

import audio from './audio';
import protocolClientHook from './protocolClientHook';
import rendererHook from './rendererHook';
// import ads from './ads';
import array from './array';
import promise from './promise';
import notifications from './notifications';
import title from './title';
import placePixelControl from './placePixelControl';
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
      audio,
      notifications,
      title,
      protocolClientHook,
      rendererHook,
      placePixelControl,
      extensions,
    ),
  ),
);


export default function configureStore(onComplete: ?() => void) {
  persistStore(store, null, () => {
    onComplete(store);
  });
  return store;
}
