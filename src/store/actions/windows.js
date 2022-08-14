/*
 * Actions that are exclusively used by windows
 */

import { t } from 'ttag';

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

export function addToChatInputMessage(windowId, msg, focus = true) {
  return (dispatch, getState) => {
    const args = getState().windows.args[windowId];
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
