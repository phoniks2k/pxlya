/*
 * Entrypoint for main client script
 */

// eslint-disable-next-line no-unused-vars
import fetch from 'isomorphic-fetch'; // TODO put in the beggining with webpack!

import onKeyPress from './controls/keypress';
import {
  fetchMe,
  fetchStats,
  initTimer,
  urlChange,
  receiveOnline,
  receiveCoolDown,
  receiveChatMessage,
  addChatChannel,
  removeChatChannel,
  setMobile,
  windowResize,
} from './actions';
import {
  receivePixelUpdate,
  receivePixelReturn,
} from './ui/placePixel';
import store from './ui/store';


import renderApp from './components/App';

import { initRenderer, getRenderer } from './ui/renderer';
import SocketClient from './socket/SocketClient';

function init() {
  initRenderer(store, false);

  SocketClient.on('pixelUpdate', ({
    i, j, pixels,
  }) => {
    pixels.forEach((pxl) => {
      const [offset, color] = pxl;
      // remove protection
      receivePixelUpdate(store, i, j, offset, color & 0x7F);
    });
  });
  SocketClient.on('pixelReturn', ({
    retCode, wait, coolDownSeconds, pxlCnt,
  }) => {
    receivePixelReturn(store, retCode, wait, coolDownSeconds, pxlCnt);
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
    const { nameRegExp } = state.user;

    // assume that if one chat window is not hidden, all are
    let isRead = state.windows.showWindows
      // eslint-disable-next-line max-len
      && state.windows.windows.find((win) => win.windowType === 'CHAT' && win.hidden === false)
      // eslint-disable-next-line max-len
      && Object.values(state.windows.args).find((args) => args.chatChannel === channelId);
    isRead = isRead || state.windows.modal.open
      && state.windows.args[0].chatChannel === channelId;

    // TODO ping doesn't work since update
    const isPing = (nameRegExp && text.match(nameRegExp));
    store.dispatch(receiveChatMessage(
      name,
      text,
      country,
      channelId,
      userId,
      isPing,
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

  store.dispatch(fetchStats());
  // TODO: We don't have to do this this often
  // the client might not even look at it
  setInterval(() => { store.dispatch(fetchStats()); }, 300000);
}
init();

document.addEventListener('DOMContentLoaded', () => {
  renderApp(document.getElementById('app'));

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
});


// on captcha received
window.onCaptcha = async function onCaptcha(token) {
  const body = JSON.stringify({
    token,
  });
  await fetch('/api/captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  const {
    i, j, pixels,
  } = window.pixel;
  SocketClient.requestPlacePixels(i, j, pixels);

  if (typeof window.hcaptcha !== 'undefined') {
    window.hcaptcha.reset();
    const domBody = document.getElementsByTagName('BODY')[0];
    domBody.style.overflowY = null;
    domBody.style.overflow = 'hidden';
  } else {
    window.grecaptcha.reset();
  }
};
