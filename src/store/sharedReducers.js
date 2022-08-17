/*
 * reducers that are shared between pages
 */

/* eslint-disable no-console */

import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import gui from './reducers/gui';
import ranks from './reducers/ranks';
import chatRead from './reducers/chatRead';

export const CURRENT_VERSION = 8;

export const migrate = (state, version) => {
  if (!state || version !== CURRENT_VERSION) {
    console.log('Newer version run, resetting store.');
    return Promise.resolve({});
  }
  console.log(`Store version: ${version}`);
  return Promise.resolve(state);
};

const guiPersist = persistReducer({
  key: 'gui',
  storage,
  version: CURRENT_VERSION,
  migrate,
}, gui);

const ranksPersist = persistReducer({
  key: 'ranks',
  storage,
  version: CURRENT_VERSION,
  migrate,
}, ranks);

const chatReadPersist = persistReducer({
  key: 'cr',
  storage,
  version: CURRENT_VERSION,
  migrate,
}, chatRead);

export default {
  gui: guiPersist,
  ranks: ranksPersist,
  chatRead: chatReadPersist,
};
