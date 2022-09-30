/*
 * Main Script for windows (pop-ups and stuff)
 */

import { persistStore } from 'redux-persist';

import { parentExists } from './core/utils';
import store from './store/storePopUp';
import {
  urlChange,
  receiveOnline,
  receiveChatMessage,
  removeChatChannel,
  addChatChannel,
} from './store/actions';
import {
  fetchMe,
} from './store/actions/thunks';
import SocketClient from './socket/SocketClient';
import renderAppPopUp from './components/AppPopUp';

persistStore(store, {}, () => {
  window.addEventListener('message', store.dispatch);

  store.dispatch({ type: 'HYDRATED' });

  window.addEventListener('popstate', () => {
    store.dispatch(urlChange());
  });

  SocketClient.on('onlineCounter', (online) => {
    store.dispatch(receiveOnline(online));
  });
  SocketClient.on('chatMessage', (
    name,
    text,
    country,
    channelId,
    userId,
  ) => {
    const state = store.getState();

    // assume that if one chat window is not hidden, all are
    const isRead = state.popup.windowType === 'CHAT'
      && state.popup.args.chatChannel === channelId;

    // TODO ping doesn't work since update
    // const { nameRegExp } = state.user;
    // const isPing = (nameRegExp && text.match(nameRegExp));
    store.dispatch(receiveChatMessage(
      name,
      text,
      country,
      channelId,
      userId,
      false,
      !!isRead,
    ));
  });
  SocketClient.on('changedMe', () => {
    store.dispatch(fetchMe());
  });
  SocketClient.on('remch', (cid) => {
    store.dispatch(removeChatChannel(cid));
  });
  SocketClient.on('addch', (channel) => {
    store.dispatch(addChatChannel(channel));
  });

  if (!parentExists()) {
    store.dispatch(fetchMe());
    SocketClient.connect();
  }
});

(function load() {
  const onLoad = () => {
    renderAppPopUp(document.getElementById('app'), store);
    document.removeEventListener('DOMContentLoaded', onLoad);
  };
  document.addEventListener('DOMContentLoaded', onLoad, false);
}());
