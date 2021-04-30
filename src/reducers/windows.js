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

function clampSize(prefWidth, prefHeight, margin = false) {
  const width = prefWidth || 550;
  const height = prefHeight || 330;
  let maxWidth = window.innerWidth;
  let maxHeight = window.innerHeight;
  if (margin) {
    maxWidth = Math.floor(maxWidth * 0.75);
    maxHeight = Math.floor(maxHeight * 0.75);
  }
  return [
    clamp(
      width,
      MIN_WIDTH,
      maxWidth,
    ),
    clamp(
      height,
      MIN_HEIGHT,
      maxHeight,
    ),
  ];
}

function clampPos(prefXPos, prefYPos, width, height) {
  const xPos = (prefXPos || prefXPos === 0) ? prefXPos
    : Math.floor((window.innerWidth - width) / 2);
  const yPos = (prefYPos || prefYPos === 0) ? prefYPos
    : Math.floor((window.innerHeight - height) / 2);
  return [
    clamp(
      xPos,
      SCREEN_MARGIN_EW - width,
      window.innerWidth - SCREEN_MARGIN_EW,
    ),
    clamp(
      yPos,
      0,
      window.innerHeight - SCREEN_MARGIN_S,
    ),
  ];
}

export type WindowsState = {
  // modal is considerd as "fullscreen window"
  // its windowId is considered 0 and args are under args[0]
  showWindows: boolean,
  modal: {
    windowType: ?string,
    title: ?string,
    open: boolean,
    // used to remember and restore the size
    // of a maximized window when restoring
    // {
    //   xPos: number,
    //   yPos: number,
    //   width: number,
    //   height: number,
    //   cloneable: boolean,
    // }
    prevWinSize: Object,
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
    prevWinSize: {},
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
      /*
       * prefered xPos, yPos, height adn width
       * can be given in action (but doesn't have to)
       */
      const {
        windowType,
        title,
        cloneable,
        args,
        xPos: prefXPos,
        yPos: prefYPos,
        width: prefWidth,
        height: prefHeight,
      } = action;

      const [width, height] = clampSize(prefWidth, prefHeight, true);
      const [xPos, yPos] = clampPos(prefXPos, prefYPos, width, height);

      const fullscreen = !state.showWindows || action.fullscreen;
      if (fullscreen) {
        return {
          ...state,
          modal: {
            windowType,
            title,
            open: true,
            prevWinSize: {
              width,
              height,
              xPos,
              yPos,
              cloneable,
            },
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
            width,
            height,
            xPos,
            yPos,
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
            prevWinSize: {},
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

    case 'CHANGE_WINDOW_TYPE': {
      const {
        windowId,
        windowType,
      } = action;
      const args = {
        ...state.args,
        [windowId]: {
          ...action.args,
        },
      };
      if (windowId === 0) {
        return {
          ...state,
          args,
          modal: {
            ...state.modal,
            windowType,
          },
        };
      }
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) {
          return win;
        }
        return {
          ...win,
          windowType,
        };
      });
      return {
        ...state,
        args,
        windows: newWindows,
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
      const {
        windowType,
        title,
        xPos,
        yPos,
        width,
        height,
        cloneable,
      } = state.windows
        .find((w) => w.windowId === windowId);
      delete args[windowId];
      return {
        ...state,
        modal: {
          windowType,
          title,
          open: true,
          prevWinSize: {
            xPos,
            yPos,
            width,
            height,
            cloneable,
          },
        },
        windows: state.windows.filter((w) => w.windowId !== windowId),
        args,
      };
    }

    case 'RESTORE_WINDOW': {
      const windowId = generateWindowId(state);
      const { windowType, title, prevWinSize } = state.modal;
      const [width, height] = clampSize(
        prevWinSize.width,
        prevWinSize.height,
      );
      const [xPos, yPos] = clampPos(
        prevWinSize.xPos,
        prevWinSize.yPos,
        width,
        height,
      );
      const cloneable = prevWinSize.cloneable || true;
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
            width,
            height,
            xPos,
            yPos,
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
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        const [xPos, yPos] = clampPos(
          win.xPos + xDiff,
          win.yPos + yDiff,
          win.width,
          win.height,
        );
        return {
          ...win,
          xPos,
          yPos,
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
        const [width, height] = clampSize(
          win.width + xDiff,
          win.height + yDiff,
          false,
        );
        return {
          ...win,
          width: Math.max(width, SCREEN_MARGIN_EW - win.xPos),
          height,
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
        innerWidth: width,
        innerHeight: height,
      } = window;

      if (width <= SCREEN_WIDTH_THRESHOLD) {
        return {
          ...state,
          showWindows: false,
        };
      }

      const xMax = width - SCREEN_MARGIN_EW;
      const yMax = height - SCREEN_MARGIN_S;
      let modified = false;

      let newWindows = [];
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

      if (action.type === 'RECEIVE_ME') {
        const args = { ...state.args };
        newWindows = newWindows.filter((win) => {
          if (win.open) return true;
          // eslint-disable-next-line no-console
          console.log(
            `Cleaning up window from previous session: ${win.windowId}`,
          );
          delete args[win.windowId];
          return false;
        });

        return {
          ...state,
          showWindows: true,
          windows: newWindows,
          args,
        };
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
