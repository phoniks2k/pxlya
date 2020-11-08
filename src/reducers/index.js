/* @flow */

import { persistCombineReducers } from 'redux-persist';
import localForage from 'localforage';
import audio from './audio';
import canvas from './canvas';
import gui from './gui';
import modal from './modal';
import user from './user';
import chat from './chat';
import contextMenu from './contextMenu';

import type { AudioState } from './audio';
import type { CanvasState } from './canvas';
import type { GUIState } from './gui';
import type { ModalState } from './modal';
import type { UserState } from './user';
import type { ChatState } from './chat';
import type { ContextMenuState } from './contextMenu';

export type State = {
  audio: AudioState,
  canvas: CanvasState,
  gui: GUIState,
  modal: ModalState,
  user: UserState,
  chat: ChatState,
  contextMenu: ContextMenuState,
};

const config = {
  key: 'primary',
  storage: localForage,
  blacklist: [
    'user',
    'canvas',
    'modal',
    'chat',
    'contextMenu',
  ],
};

export default persistCombineReducers(config, {
  audio,
  canvas,
  gui,
  modal,
  user,
  chat,
  contextMenu,
});
