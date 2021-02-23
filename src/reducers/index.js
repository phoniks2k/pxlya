/* @flow */

import { persistCombineReducers } from 'redux-persist';
import localForage from 'localforage';
import audio from './audio';
import canvas from './canvas';
import gui from './gui';
import modal from './modal';
import user from './user';
import ranks from './ranks';
import alert from './alert';
import chat from './chat';
import contextMenu from './contextMenu';
import chatRead from './chatRead';
import fetching from './fetching';

import type { AudioState } from './audio';
import type { CanvasState } from './canvas';
import type { GUIState } from './gui';
import type { ModalState } from './modal';
import type { UserState } from './user';
import type { RanksState } from './ranks';
import type { AlertState } from './alert';
import type { ChatState } from './chat';
import type { ContextMenuState } from './contextMenu';
import type { FetchingState } from './fetching';

export type State = {
  audio: AudioState,
  canvas: CanvasState,
  gui: GUIState,
  modal: ModalState,
  user: UserState,
  ranks: RanksState,
  alert: AlertState,
  chat: ChatState,
  contextMenu: ContextMenuState,
  chatRead: ChatReadState,
  fetching: FetchingState,
};

const config = {
  key: 'primary',
  storage: localForage,
  blacklist: [
    'user',
    'ranks',
    'canvas',
    'alert',
    'modal',
    'chat',
    'contextMenu',
    'fetching',
  ],
};

export default persistCombineReducers(config, {
  audio,
  canvas,
  gui,
  modal,
  user,
  ranks,
  alert,
  chat,
  contextMenu,
  chatRead,
  fetching,
});
