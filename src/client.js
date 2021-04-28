/* @flow */

// eslint-disable-next-line no-unused-vars
import fetch from 'isomorphic-fetch'; // TODO put in the beggining with webpack!

import './styles/font.css';

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
import ProtocolClient from './socket/ProtocolClient';

function init() {
  initRenderer(store, false);

  ProtocolClient.on('pixelUpdate', ({
    i, j, pixels,
  }) => {
    pixels.forEach((pxl) => {
      const [offset, color] = pxl;
      // remove protection
      receivePixelUpdate(store, i, j, offset, color & 0x7F);
    });
  });
  ProtocolClient.on('pixelReturn', ({
    retCode, wait, coolDownSeconds, pxlCnt,
  }) => {
    receivePixelReturn(store, retCode, wait, coolDownSeconds, pxlCnt);
  });
  ProtocolClient.on('cooldownPacket', (coolDown) => {
    store.dispatch(receiveCoolDown(coolDown));
  });
  ProtocolClient.on('onlineCounter', ({ online }) => {
    store.dispatch(receiveOnline(online));
  });
  ProtocolClient.on('chatMessage', (
    name,
    text,
    country,
    channelId,
    userId,
  ) => {
    const state = store.getState();
    const { nameRegExp } = state.user;
    const isPing = (nameRegExp && text.match(nameRegExp));
    store.dispatch(receiveChatMessage(
      name,
      text,
      country,
      Number(channelId),
      userId,
      isPing,
    ));
  });
  ProtocolClient.on('changedMe', () => {
    store.dispatch(fetchMe());
  });
  ProtocolClient.on('remch', (cid) => {
    store.dispatch(removeChatChannel(cid));
  });
  ProtocolClient.on('addch', (channel) => {
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
    store.dispatch(windowResize(window.innerWidth, window.innerHeight));
  }
  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  store.dispatch(initTimer());

  store.dispatch(fetchMe());
  ProtocolClient.connect();

  store.dispatch(fetchStats());
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
          cnt++;
          const [zc, xc, yc] = value.cell;
          if (!renderer.isChunkInView(zc, xc, yc)) {
            if (value.isBasechunk) {
              ProtocolClient.deRegisterChunk([xc, yc]);
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
window.onCaptcha = async function onCaptcha(token: string) {
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
  ProtocolClient.requestPlacePixels(i, j, pixels);

  if (typeof window.hcaptcha !== 'undefined') {
    window.hcaptcha.reset();
    const domBody = document.getElementsByTagName('BODY')[0];
    domBody.style.overflowY = null;
    domBody.style.overflow = 'hidden';
  } else {
    window.grecaptcha.reset();
  }
};
