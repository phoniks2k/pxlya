/* @flow */

import { persistCombineReducers } from 'redux-persist';
import localForage from 'localforage';
import audio from './audio';
import canvas from './canvas';
import gui from './gui';
import windows from './windows';
import user from './user';
import ranks from './ranks';
import alert from './alert';
import chat from './chat';
import contextMenu from './contextMenu';
import chatRead from './chatRead';
import fetching from './fetching';

const config = {
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
};

export default persistCombineReducers(config, {
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
