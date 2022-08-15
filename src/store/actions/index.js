import { t } from 'ttag';

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

export function setAllowSettingPixel(allowSettingPixel) {
  return {
    type: 'ALLOW_SETTING_PIXEL',
    allowSettingPixel,
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

export function receiveMe(
  me,
) {
  return {
    type: 'RECEIVE_ME',
    ...me,
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

/*
 * check socket/packets/PixelReturn.js for args
 */
export function storeReceivePixelReturn(args) {
  args.type = 'RECEIVE_PIXEL_RETURN';
  return args;
}

export function logoutUser(
) {
  return {
    type: 'LOGOUT',
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

export function markChannelAsRead(
  cid,
) {
  return {
    type: 'MARK_CHANNEL_AS_READ',
    cid,
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

