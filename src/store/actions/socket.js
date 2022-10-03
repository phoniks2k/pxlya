/*
 * actions that are fired when received by the websocket
 */
export function socketClose() {
  return {
    type: 'w/CLOSE',
  };
}

export function socketOpen() {
  return {
    type: 'w/OPEN',
  };
}

export function receiveChatMessage(
  name,
  text,
  country,
  channel,
  user,
) {
  return (dispatch, getState) => {
    channel = Number(channel);
    const state = getState();
    const isRead = state.windows.showWindows
      // eslint-disable-next-line max-len
      && state.windows.windows.find((win) => win.windowType === 'CHAT' && !win.hidden)
      // eslint-disable-next-line max-len
      && Object.values(state.windows.args).find((args) => args.chatChannel === channel);

    // TODO ping doesn't work since update
    // const { nameRegExp } = state.user;
    // const isPing = (nameRegExp && text.match(nameRegExp));
    dispatch({
      type: 's/REC_CHAT_MESSAGE',
      name,
      text,
      country,
      channel,
      user,
      isPing: false,
      isRead: !!isRead,
    });
  };
}

export function receiveCoolDown(wait) {
  return {
    type: 'REC_COOLDOWN',
    wait,
  };
}

export function receiveOnline(online) {
  return {
    type: 'REC_ONLINE',
    online,
  };
}

export function addChatChannel(channel) {
  return {
    type: 's/ADD_CHAT_CHANNEL',
    channel,
  };
}

export function removeChatChannel(cid) {
  return {
    type: 's/REMOVE_CHAT_CHANNEL',
    cid,
  };
}
