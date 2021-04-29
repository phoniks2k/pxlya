/*
 * state for open windows and modal and its content
 *
 * @flow
 */

import type { Action } from '../actions/types';

import { clamp } from '../core/utils';

const SCREEN_MARGIN_S = 30;
const SCREEN_MARGIN_EW = 70;
const MIN_WIDTH = 70;
const MIN_HEIGHT = 50;
// if screen smaller than this, hide all windows and just
// allow Modals
const SCREEN_WIDTH_THRESHOLD = 604;

function generateWindowId(state) {
  let windowId = Math.floor(Math.random() * 99999) + 1;
  while (state.args[windowId]) {
    windowId += 1;
  }
  return windowId;
}

export type WindowsState = {
  // modal is considerd as "fullscreen window"
  // its windowId is considered 0 and args are under args[0]
  showWindows: boolean,
  modal: {
    windowType: ?string,
    title: ?string,
    open: boolean,
  },
  // [
  //   {
  //     windowId: number,
  //     open: boolean,
  //     hidden: boolean,
  //     windowType: string,
  //     title: string,
  //     width: number,
  //     height: number,
  //     xPos: percentage,
  //     yPos: percentage,
  //     cloneable: boolean,
  //   },
  // ]
  windows: Array,
  // {
  //   windowId: {
  //    ...
  //   }
  // }
  args: Object,
}

const initialState: WindowsState = {
  showWindows: true,
  modal: {
    windowType: null,
    title: null,
    open: false,
  },
  windows: [],
  args: {},
};

export default function windows(
  state: WindowsState = initialState,
  action: Action,
): WindowsState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const {
        windowType,
        title,
        cloneable,
        args,
      } = action;
      const fullscreen = !state.showWindows || action.fullscreen;
      if (fullscreen) {
        return {
          ...state,
          modal: {
            windowType,
            title,
            open: true,
          },
          args: {
            ...state.args,
            0: {
              ...args,
            },
          },
        };
      }
      const windowId = generateWindowId(state);
      return {
        ...state,
        windows: [
          ...state.windows,
          {
            windowId,
            windowType,
            open: true,
            hidden: false,
            title,
            width: 600,
            height: 300,
            xPos: 200,
            yPos: 200,
            cloneable,
          },
        ],
        args: {
          ...state.args,
          [windowId]: args,
        },
      };
    }

    case 'REMOVE_WINDOW': {
      const {
        windowId,
      } = action;
      const args = { ...state.args };
      delete args[windowId];

      if (windowId === 0) {
        return {
          ...state,
          modal: {
            windowType: null,
            title: null,
            open: false,
          },
          args,
        };
      }
      return {
        ...state,
        windows: state.windows.filter((win) => win.windowId !== windowId),
        args,
      };
    }

    case 'CLOSE_WINDOW': {
      const {
        windowId,
      } = action;
      if (windowId === 0) {
        return {
          ...state,
          modal: {
            ...state.modal,
            open: false,
          },
        };
      }

      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          open: false,
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'CLOSE_ALL_WINDOW_TYPE': {
      const {
        windowType,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowType !== windowType) return win;
        return {
          ...win,
          open: false,
        };
      });
      let { modal } = state;
      if (modal.open && modal.windowType === windowType) {
        modal = {
          ...modal,
          open: false,
        };
      }
      return {
        ...state,
        modal,
        windows: newWindows,
      };
    }

    case 'HIDE_ALL_WINDOW_TYPE': {
      const {
        windowType,
        hide,
      } = action;
      console.log(`hideAllWindowTypes`, windowType, hide);
      const newWindows = state.windows.map((win) => {
        if (win.windowType !== windowType) return win;
        return {
          ...win,
          hidden: hide,
        };
      });
      let { modal } = state;
      if (hide && modal.open && modal.windowType === windowType) {
        modal = {
          ...modal,
          open: false,
        };
      }
      return {
        ...state,
        modal,
        windows: newWindows,
      };
    }

    case 'CLONE_WINDOW': {
      const {
        windowId,
      } = action;
      const win = state.windows.find((w) => w.windowId === windowId);
      const newWindowId = generateWindowId(state);
      const {
        innerWidth: width,
        innerHeight: height,
      } = window;
      return {
        ...state,
        windows: [
          ...state.windows,
          {
            ...win,
            windowId: newWindowId,
            xPos: Math.min(win.xPos + 15, width - SCREEN_MARGIN_EW),
            yPos: Math.min(win.yPos + 15, height - SCREEN_MARGIN_S),
          },
        ],
        args: {
          ...state.args,
          [newWindowId]: {
            ...state.args[windowId],
          },
        },
      };
    }

    case 'FOCUS_WINDOW': {
      const {
        windowId,
      } = action;
      const {
        windows: oldWindows,
      } = state;
      if (oldWindows.length === 0
        || oldWindows[oldWindows.length - 1].windowId === windowId
      ) {
        return state;
      }
      console.log(`focus window ${windowId}`);
      const newWindows = oldWindows.filter((w) => w.windowId !== windowId);
      const win = oldWindows.find((w) => w.windowId === windowId);
      if (win) {
        newWindows.push(win);
      }
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'MAXIMIZE_WINDOW': {
      const {
        windowId,
      } = action;
      const args = {
        ...state.args,
        0: state.args[windowId],
      };
      const { windowType, title } = state.windows
        .find((w) => w.windowId === windowId);
      delete args[windowId];
      return {
        ...state,
        modal: {
          windowType,
          title,
          open: true,
        },
        windows: state.windows.filter((w) => w.windowId !== windowId),
        args,
      };
    }

    case 'RESTORE_WINDOW': {
      const windowId = generateWindowId(state);
      const { windowType, title } = state.modal;
      const cloneable = true;
      return {
        ...state,
        modal: {
          ...state.modal,
          open: false,
        },
        windows: [
          ...state.windows,
          {
            windowType,
            windowId,
            open: true,
            hidden: false,
            title,
            width: 600,
            height: 300,
            xPos: 200,
            yPos: 200,
            cloneable,
          },
        ],
        args: {
          ...state.args,
          [windowId]: {
            ...state.args[0],
          },
        },
      };
    }

    case 'MOVE_WINDOW': {
      const {
        windowId,
        xDiff,
        yDiff,
      } = action;
      const {
        innerWidth: width,
        innerHeight: height,
      } = window;
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          xPos: clamp(
            win.xPos + xDiff,
            -win.width + SCREEN_MARGIN_EW,
            width - SCREEN_MARGIN_EW,
          ),
          yPos: clamp(win.yPos + yDiff, 0, height - SCREEN_MARGIN_S),
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'RESIZE_WINDOW': {
      const {
        windowId,
        xDiff,
        yDiff,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          width: clamp(
            win.width + xDiff,
            Math.max(MIN_WIDTH, SCREEN_MARGIN_EW - win.xPos),
            window.innerWidth,
          ),
          height: clamp(
            win.height + yDiff,
            MIN_HEIGHT,
            window.innerHeight,
          ),
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'RECEIVE_ME':
    case 'WINDOW_RESIZE': {
      const {
        width,
        height,
      } = action;

      if (width <= SCREEN_WIDTH_THRESHOLD) {
        return {
          ...state,
          showWindows: false,
        };
      }

      const xMax = width - SCREEN_MARGIN_EW;
      const yMax = height - SCREEN_MARGIN_S;
      let modified = false;

      const newWindows = [];
      for (let i = 0; i < state.windows.length; i += 1) {
        const win = state.windows[i];
        const {
          xPos,
          yPos,
          width: winWidth,
          height: winHeight,
        } = win;
        if (xPos > xMax || yPos > yMax
          || width > winWidth || height > winHeight) {
          modified = true;
          newWindows.push({
            ...win,
            xPos: Math.min(xMax, xPos),
            yPos: Math.min(yMax, yPos),
            width: Math.min(winWidth, width - SCREEN_MARGIN_S),
            height: Math.min(winHeight, height - SCREEN_MARGIN_S),
          });
        } else {
          newWindows.push(win);
        }
      }

      return {
        ...state,
        showWindows: true,
        windows: (modified) ? newWindows : state.windows,
      };
    }

    /*
     * args specific actions
     */
    case 'ADD_CHAT_INPUT_MSG': {
      const {
        windowId,
        msg,
      } = action;
      let { inputMessage } = state.args[windowId];
      const lastChar = inputMessage.substr(-1);
      const pad = (lastChar && lastChar !== ' ') ? ' ' : '';
      inputMessage += pad + msg;
      return {
        ...state,
        args: {
          ...state.args,
          [windowId]: {
            ...state.args[windowId],
            inputMessage,
          },
        },
      };
    }

    case 'SET_CHAT_CHANNEL': {
      const {
        windowId,
        cid,
      } = action;
      return {
        ...state,
        args: {
          ...state.args,
          [windowId]: {
            ...state.args[windowId],
            chatChannel: cid,
          },
        },
      };
    }

    case 'SET_CHAT_INPUT_MSG': {
      const {
        windowId,
        msg,
      } = action;
      return {
        ...state,
        args: {
          ...state.args,
          [windowId]: {
            ...state.args[windowId],
            inputMessage: msg,
          },
        },
      };
    }

    default:
      return state;
  }
}
