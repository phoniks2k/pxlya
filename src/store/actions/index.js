import { t } from 'ttag';

import {
  requestStartDm,
  requestBlock,
  requestBlockDm,
  requestLeaveChan,
  requestRankings,
  requestMe,
} from './fetch';

export function pAlert(
  title,
  message,
  alertType,
  btn = t`OK`,
) {
  return {
    type: 'ALERT',
    title,
    message,
    alertType,
    btn,
  };
}

export function closeAlert() {
  return {
    type: 'CLOSE_ALERT',
  };
}

export function toggleHistoricalView() {
  return {
    type: 'TOGGLE_HISTORICAL_VIEW',
  };
}

export function toggleHiddenCanvases() {
  return {
    type: 'TOGGLE_HIDDEN_CANVASES',
  };
}

export function toggleGrid() {
  return {
    type: 'TOGGLE_GRID',
  };
}

export function togglePixelNotify() {
  return {
    type: 'TOGGLE_PIXEL_NOTIFY',
  };
}

export function toggleAutoZoomIn() {
  return {
    type: 'TOGGLE_AUTO_ZOOM_IN',
  };
}

export function toggleOnlineCanvas() {
  return {
    type: 'TOGGLE_ONLINE_CANVAS',
  };
}

export function toggleMute() {
  return {
    type: 'TOGGLE_MUTE',
  };
}

export function toggleCompactPalette() {
  return {
    type: 'TOGGLE_COMPACT_PALETTE',
  };
}

export function toggleChatNotify() {
  return {
    type: 'TOGGLE_CHAT_NOTIFY',
  };
}

export function togglePotatoMode() {
  return {
    type: 'TOGGLE_POTATO_MODE',
  };
}

export function toggleLightGrid() {
  return {
    type: 'TOGGLE_LIGHT_GRID',
  };
}

export function toggleOpenPalette() {
  return {
    type: 'TOGGLE_OPEN_PALETTE',
  };
}

export function selectStyle(style) {
  return {
    type: 'SELECT_STYLE',
    style,
  };
}

export function toggleOpenMenu() {
  return {
    type: 'TOGGLE_OPEN_MENU',
  };
}

/*
 * requestingPixel is inveted, it has the meaning of
 * "can i request a pixel"
 */
export function setRequestingPixel(requestingPixel) {
  return {
    type: 'SET_REQUESTING_PIXEL',
    requestingPixel,
  };
}

export function setNotification(notification) {
  return {
    type: 'SET_NOTIFICATION',
    notification,
  };
}

export function unsetNotification() {
  return {
    type: 'UNSET_NOTIFICATION',
  };
}

export function setHover(hover) {
  return {
    type: 'SET_HOVER',
    hover,
  };
}

export function unsetHover() {
  return {
    type: 'UNSET_HOVER',
  };
}

export function setWait(wait) {
  return {
    type: 'SET_WAIT',
    wait,
  };
}

export function setMobile(mobile) {
  return {
    type: 'SET_MOBILE',
    mobile,
  };
}

export function windowResize() {
  return {
    type: 'WINDOW_RESIZE',
  };
}

export function selectColor(color) {
  return {
    type: 'SELECT_COLOR',
    color,
  };
}

export function selectCanvas(canvasId) {
  return {
    type: 'SELECT_CANVAS',
    canvasId,
  };
}

export function placedPixels(amount) {
  return {
    type: 'PLACED_PIXELS',
    amount,
  };
}

export function pixelWait() {
  return {
    type: 'PIXEL_WAIT',
  };
}

export function receiveOnline(online) {
  return {
    type: 'RECEIVE_ONLINE',
    online,
  };
}

export function receiveChatMessage(
  name,
  text,
  country,
  channel,
  user,
  isPing,
  isRead,
) {
  return {
    type: 'RECEIVE_CHAT_MESSAGE',
    name,
    text,
    country,
    channel,
    user,
    isPing,
    isRead,
  };
}

let lastNotify = null;
export function notify(notification) {
  return async (dispatch) => {
    dispatch(setNotification(notification));
    if (lastNotify) {
      clearTimeout(lastNotify);
      lastNotify = null;
    }
    lastNotify = setTimeout(() => {
      dispatch(unsetNotification());
    }, 1500);
  };
}

export function setViewCoordinates(view) {
  return {
    type: 'SET_VIEW_COORDINATES',
    view,
  };
}

export function move([dx, dy]) {
  return (dispatch, getState) => {
    const { view } = getState().canvas;

    const [x, y] = view;
    dispatch(setViewCoordinates([x + dx, y + dy]));
  };
}

export function moveDirection([vx, vy]) {
  return (dispatch, getState) => {
    const { viewscale } = getState().canvas;

    const speed = 100.0 / viewscale;
    dispatch(move([speed * vx, speed * vy]));
  };
}

export function moveNorth() {
  return (dispatch) => {
    dispatch(moveDirection([0, -1]));
  };
}

export function moveWest() {
  return (dispatch) => {
    dispatch(moveDirection([-1, 0]));
  };
}

export function moveSouth() {
  return (dispatch) => {
    dispatch(moveDirection([0, 1]));
  };
}

export function moveEast() {
  return (dispatch) => {
    dispatch(moveDirection([1, 0]));
  };
}

export function setScale(scale, zoompoint) {
  return {
    type: 'SET_SCALE',
    scale,
    zoompoint,
  };
}

export function zoomIn(zoompoint) {
  return (dispatch, getState) => {
    const { scale } = getState().canvas;
    const zoomscale = scale >= 1.0 ? scale * 1.1 : scale * 1.04;
    dispatch(setScale(zoomscale, zoompoint));
  };
}

export function zoomOut(zoompoint) {
  return (dispatch, getState) => {
    const { scale } = getState().canvas;
    const zoomscale = scale >= 1.0 ? scale / 1.1 : scale / 1.04;
    dispatch(setScale(zoomscale, zoompoint));
  };
}

export function requestBigChunk(center) {
  return {
    type: 'REQUEST_BIG_CHUNK',
    center,
  };
}

export function preLoadedBigChunk(
  center,
) {
  return {
    type: 'PRE_LOADED_BIG_CHUNK',
    center,
  };
}

export function receiveBigChunk(
  center,
  chunk,
) {
  return {
    type: 'RECEIVE_BIG_CHUNK',
    center,
    chunk,
  };
}

export function receiveBigChunkFailure(center, error) {
  return {
    type: 'RECEIVE_BIG_CHUNK_FAILURE',
    center,
    error,
  };
}

export function receiveCoolDown(
  wait,
) {
  return {
    type: 'RECEIVE_COOLDOWN',
    wait,
  };
}

/*
 * draw pixel on canvas
 * @param i, j, offset Chunk and offset in chunk
 * @param color integer Color Index
 * @param notifyPxl Bool if pixel notification appears (false when my own pixel)
 */
export function updatePixel(
  i,
  j,
  offset,
  color,
  notifyPxl = true,
) {
  return {
    type: 'UPDATE_PIXEL',
    i,
    j,
    offset,
    color,
    notify: notifyPxl,
  };
}

export function loginUser(
  me,
) {
  return {
    type: 'LOGIN',
    ...me,
  };
}

export function receiveMe(
  me,
) {
  return {
    type: 'RECEIVE_ME',
    ...me,
  };
}

export function logoutUser(
) {
  return {
    type: 'LOGOUT',
  };
}

export function receiveStats(
  rankings,
) {
  const { ranking: totalRanking, dailyRanking: totalDailyRanking } = rankings;
  return {
    type: 'RECEIVE_STATS',
    totalRanking,
    totalDailyRanking,
  };
}

export function setName(
  name,
) {
  return {
    type: 'SET_NAME',
    name,
  };
}

export function setMailreg(
  mailreg,
) {
  return {
    type: 'SET_MAILREG',
    mailreg,
  };
}

export function remFromMessages(
  message,
) {
  return {
    type: 'REM_FROM_MESSAGES',
    message,
  };
}

export function fetchStats() {
  return async (dispatch) => {
    const rankings = await requestRankings();
    if (!rankings.errors) {
      dispatch(receiveStats(rankings));
    }
  };
}

export function fetchMe() {
  return async (dispatch) => {
    const me = await requestMe();
    if (!me.errors) {
      dispatch(receiveMe(me));
    }
  };
}

function receiveChatHistory(
  cid,
  history,
) {
  return {
    type: 'RECEIVE_CHAT_HISTORY',
    cid,
    history,
  };
}

export function markChannelAsRead(
  cid,
) {
  return {
    type: 'MARK_CHANNEL_AS_READ',
    cid,
  };
}

function setChatFetching(fetching) {
  return {
    type: 'SET_CHAT_FETCHING',
    fetching,
  };
}

function setApiFetching(fetching) {
  return {
    type: 'SET_API_FETCHING',
    fetching,
  };
}

export function fetchChatMessages(
  cid,
) {
  return async (dispatch) => {
    dispatch(setChatFetching(true));
    const response = await fetch(`api/chathistory?cid=${cid}&limit=50`, {
      credentials: 'include',
    });

    /*
     * timeout in order to not spam api requests and get rate limited
     */
    if (response.ok) {
      setTimeout(() => { dispatch(setChatFetching(false)); }, 500);
      const { history } = await response.json();
      dispatch(receiveChatHistory(cid, history));
    } else {
      setTimeout(() => { dispatch(setChatFetching(false)); }, 5000);
    }
  };
}

function setCoolDown(coolDown) {
  return {
    type: 'COOLDOWN_SET',
    coolDown,
  };
}

function endCoolDown() {
  return {
    type: 'COOLDOWN_END',
  };
}

function getPendingActions(state) {
  const actions = [];
  const now = Date.now();

  const { wait } = state.user;

  const coolDown = wait - now;

  if (wait !== null && wait !== undefined) {
    if (coolDown > 0) actions.push(setCoolDown(coolDown));
    else actions.push(endCoolDown());
  }

  return actions;
}

export function initTimer() {
  return (dispatch, getState) => {
    function tick() {
      const state = getState();
      const actions = getPendingActions(state);
      dispatch(actions);
    }

    // something shorter than 1000 ms
    setInterval(tick, 333);
  };
}

/*
 * fullscreen means to open as modal
 * Look into store/reducers/windows.js to know what it means
 */
export function openWindow(
  windowType,
  title = '',
  args = null,
  fullscreen = false,
  cloneable = true,
  xPos = null,
  yPos = null,
  width = null,
  height = null,
) {
  return {
    type: 'OPEN_WINDOW',
    windowType,
    title,
    args,
    fullscreen,
    cloneable,
    xPos,
    yPos,
    width,
    height,
  };
}

export function setWindowArgs(
  windowId,
  args,
) {
  return {
    type: 'SET_WINDOW_ARGS',
    windowId,
    args,
  };
}

function showFullscreenWindow(modalType, title) {
  return openWindow(
    modalType,
    title,
    null,
    true,
  );
}

export function closeFullscreenWindows() {
  return {
    type: 'CLOSE_FULLSCREEN_WINDOWS',
  };
}

export function showSettingsModal() {
  return showFullscreenWindow(
    'SETTINGS',
    '',
  );
}

export function showUserAreaModal() {
  return showFullscreenWindow(
    'USERAREA',
    '',
  );
}

export function changeWindowType(
  windowId,
  windowType,
  title = '',
  args = null,
) {
  return {
    type: 'CHANGE_WINDOW_TYPE',
    windowId,
    windowType,
    title,
    args,
  };
}

export function setWindowTitle(windowId, title) {
  return {
    type: 'SET_WINDOW_TITLE',
    windowId,
    title,
  };
}

export function showRegisterModal() {
  return showFullscreenWindow(
    'REGISTER',
    t`Register New Account`,
  );
}

export function showForgotPasswordModal() {
  return showFullscreenWindow(
    'FORGOT_PASSWORD',
    t`Restore my Password`,
  );
}

export function showHelpModal() {
  return showFullscreenWindow(
    'HELP',
    t`Welcome to PixelPlanet.fun`,
  );
}
export function showArchiveModal() {
  return showFullscreenWindow(
    'ARCHIVE',
    t`Look at past Canvases`,
  );
}

export function showCanvasSelectionModal() {
  return showFullscreenWindow(
    'CANVAS_SELECTION',
    '',
  );
}

export function showContextMenu(
  menuType,
  xPos,
  yPos,
  args,
) {
  return {
    type: 'SHOW_CONTEXT_MENU',
    menuType,
    xPos,
    yPos,
    args,
  };
}

export function openChatChannel(cid) {
  return {
    type: 'OPEN_CHAT_CHANNEL',
    cid,
  };
}

export function closeChatChannel(cid) {
  return {
    type: 'CLOSE_CHAT_CHANNEL',
    cid,
  };
}

export function addChatChannel(channel) {
  return {
    type: 'ADD_CHAT_CHANNEL',
    channel,
  };
}

export function blockUser(userId, userName) {
  return {
    type: 'BLOCK_USER',
    userId,
    userName,
  };
}

export function unblockUser(userId, userName) {
  return {
    type: 'UNBLOCK_USER',
    userId,
    userName,
  };
}

export function blockingDm(blockDm) {
  return {
    type: 'SET_BLOCKING_DM',
    blockDm,
  };
}

export function removeChatChannel(cid) {
  return {
    type: 'REMOVE_CHAT_CHANNEL',
    cid,
  };
}

export function muteChatChannel(cid) {
  return {
    type: 'MUTE_CHAT_CHANNEL',
    cid,
  };
}

export function unmuteChatChannel(cid) {
  return {
    type: 'UNMUTE_CHAT_CHANNEL',
    cid,
  };
}

export function addToChatInputMessage(windowId, msg, focus = true) {
  return (dispatch, getState) => {
    const args = getState().windows.args[windowId];
    console.log(getState().windows.args, args);
    let inputMessage = args && args.inputMessage;
    if (!inputMessage) {
      inputMessage = '';
    } else if (inputMessage.slice(-1) !== ' ') {
      inputMessage += ' ';
    }
    inputMessage += msg;

    dispatch(setWindowArgs(windowId, {
      inputMessage,
    }));

    if (focus) {
      const inputElem = document.getElementById(`chtipt-${windowId}`);
      if (inputElem) {
        inputElem.focus();
      }
    }
  };
}

export function closeWindow(windowId) {
  return {
    type: 'CLOSE_WINDOW',
    windowId,
  };
}

export function removeWindow(windowId) {
  return {
    type: 'REMOVE_WINDOW',
    windowId,
  };
}

export function focusWindow(windowId) {
  return {
    type: 'FOCUS_WINDOW',
    windowId,
  };
}

export function cloneWindow(windowId) {
  return {
    type: 'CLONE_WINDOW',
    windowId,
  };
}

export function toggleMaximizeWindow(windowId) {
  return {
    type: 'TOGGLE_MAXIMIZE_WINDOW',
    windowId,
  };
}

export function moveWindow(windowId, xDiff, yDiff) {
  return {
    type: 'MOVE_WINDOW',
    windowId,
    xDiff,
    yDiff,
  };
}

export function resizeWindow(windowId, xDiff, yDiff) {
  return {
    type: 'RESIZE_WINDOW',
    windowId,
    xDiff,
    yDiff,
  };
}

export function closeAllWindowTypes(windowType) {
  return {
    type: 'CLOSE_ALL_WINDOW_TYPE',
    windowType,
  };
}

export function hideAllWindowTypes(
  windowType,
  hide,
) {
  return {
    type: 'HIDE_ALL_WINDOW_TYPE',
    windowType,
    hide,
  };
}

export function openChatWindow() {
  const width = 350;
  const height = 350;
  return openWindow(
    'CHAT',
    '',
    null,
    false,
    true,
    window.innerWidth - width - 62,
    window.innerHeight - height - 64,
    width,
    height,
  );
}

/*
 * query with either userId or userName
 */
export function startDm(windowId, query) {
  return async (dispatch) => {
    dispatch(setApiFetching(true));
    const res = await requestStartDm(query);
    if (typeof res === 'string') {
      dispatch(pAlert(
        'Direct Message Error',
        res,
        'error',
        'OK',
      ));
    } else {
      const cid = Number(Object.keys(res)[0]);
      dispatch(addChatChannel(res));
      dispatch(setWindowArgs(windowId, {
        chatChannel: cid,
      }));
    }
    dispatch(setApiFetching(false));
  };
}

export function gotCoolDownDelta(delta) {
  return {
    type: 'COOLDOWN_DELTA',
    delta,
  };
}

export function setUserBlock(
  userId,
  userName,
  block,
) {
  return async (dispatch) => {
    dispatch(setApiFetching(true));
    const res = await requestBlock(userId, block);
    if (res) {
      dispatch(pAlert(
        'User Block Error',
        res,
        'error',
        'OK',
      ));
    } else if (block) {
      dispatch(blockUser(userId, userName));
    } else {
      dispatch(unblockUser(userId, userName));
    }
    dispatch(setApiFetching(false));
  };
}

export function setBlockingDm(
  block,
) {
  return async (dispatch) => {
    dispatch(setApiFetching(true));
    const res = await requestBlockDm(block);
    if (res) {
      dispatch(pAlert(
        'Blocking DMs Error',
        res,
        'error',
        'OK',
      ));
    } else {
      dispatch(blockingDm(block));
    }
    dispatch(setApiFetching(false));
  };
}

export function setLeaveChannel(
  cid,
) {
  return async (dispatch) => {
    dispatch(setApiFetching(true));
    const res = await requestLeaveChan(cid);
    if (res) {
      dispatch(pAlert(
        'Leaving Channel Error',
        res,
        'error',
        'OK',
      ));
    } else {
      dispatch(removeChatChannel(cid));
    }
    dispatch(setApiFetching(false));
  };
}

export function hideContextMenu() {
  return {
    type: 'HIDE_CONTEXT_MENU',
  };
}

export function reloadUrl() {
  return {
    type: 'RELOAD_URL',
  };
}

export function onViewFinishChange() {
  return {
    type: 'ON_VIEW_FINISH_CHANGE',
  };
}

export function selectHistoricalTime(date, time) {
  return {
    type: 'SET_HISTORICAL_TIME',
    date,
    time,
  };
}

export function urlChange() {
  return (dispatch) => {
    dispatch(reloadUrl());
  };
}
