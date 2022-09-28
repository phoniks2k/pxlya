/*
 * Entrypoint for main client script
 */

import { persistStore } from 'redux-persist';

import createKeyPressHandler from './controls/keypress';
import {
  initTimer,
  urlChange,
  receiveOnline,
  receiveCoolDown,
  receiveChatMessage,
  addChatChannel,
  removeChatChannel,
  setMobile,
  windowResize,
} from './store/actions';
import {
  fetchMe,
} from './store/actions/thunks';
import {
  receivePixelUpdate,
  receivePixelReturn,
} from './ui/placePixel';
import store from './store/store';
import renderApp from './components/App';
import { initRenderer, getRenderer } from './ui/renderer';
import SocketClient from './socket/SocketClient';

persistStore(store, {}, () => {
  window.addEventListener('message', store.dispatch);

  store.dispatch({ type: 'HYDRATED' });

  initRenderer(store, false);

  SocketClient.on('pixelUpdate', ({
    i, j, pixels,
  }) => {
    pixels.forEach((pxl) => {
      const [offset, color] = pxl;
      // remove protection
      receivePixelUpdate(getRenderer(), i, j, offset, color & 0x7F);
    });
  });
  SocketClient.on('pixelReturn', (args) => {
    receivePixelReturn(store, getRenderer(), args);
  });
  SocketClient.on('cooldownPacket', (coolDown) => {
    store.dispatch(receiveCoolDown(coolDown));
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
    const isRead = state.windows.showWindows
      // eslint-disable-next-line max-len
      && state.windows.windows.find((win) => win.windowType === 'CHAT' && !win.hidden)
      // eslint-disable-next-line max-len
      && Object.values(state.windows.args).find((args) => args.chatChannel === channelId);

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

  window.addEventListener('hashchange', () => {
    store.dispatch(urlChange());
  });

  // check if on mobile
  //
  function checkMobile() {
    store.dispatch(setMobile(true));
  }
  document.addEventListener('touchstart', checkMobile, { once: true });

  // listen for resize
  //
  function onWindowResize() {
    store.dispatch(windowResize());
  }
  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  store.dispatch(initTimer());

  store.dispatch(fetchMe());
  SocketClient.connect();
});

(function load() {
  const onLoad = () => {
    window.name = 'main';
    renderApp(document.getElementById('app'), store);

    const onKeyPress = createKeyPressHandler(store);
    document.addEventListener('keydown', onKeyPress, false);

    // garbage collection
    function runGC() {
      const renderer = getRenderer();

      const chunks = renderer.getAllChunks();
      if (chunks) {
        const curTime = Date.now();
        let cnt = 0;
        chunks.forEach((value, key) => {
          if (curTime > value.timestamp + 300000) {
            const [zc, xc, yc] = value.cell;
            if (!renderer.isChunkInView(zc, xc, yc)) {
              cnt++;
              if (value.isBasechunk) {
                SocketClient.deRegisterChunk([xc, yc]);
              }
              chunks.delete(key);
              value.destructor();
            }
          }
        });
        // eslint-disable-next-line no-console
        console.log('Garbage collection cleaned', cnt, 'chunks');
      }
    }
    setInterval(runGC, 300000);

    document.removeEventListener('DOMContentLoaded', onLoad);
  };
  document.addEventListener('DOMContentLoaded', onLoad, false);
}());
