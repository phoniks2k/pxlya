/*
 * state for open windows and modal and its content
 *
 * @flow
 */

import type { Action } from '../actions/types';

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
  modal: {
    windowType: ?string,
    title: ?string,
    open: boolean,
  },
  // [
  //   {
  //     windowId: number,
  //     windowOpen: boolean,
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
        fullscreen,
        cloneable,
        args,
      } = action;
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
            windowOpen: true,
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
      /*
        const newWindows = state.windows.map((win) => {
          if (win.windowId !== windowId) return win;
          return {
            ...win,
            windowOpen: false,
          }
        });
        return {
          ...state,
          windows: newWindows,
        };
        */
      const args = { ...state.args };
      delete args[windowId];
      return {
        ...state,
        windows: state.windows.filter((win) => win.windowId !== windowId),
        args,
      };
    }

    case 'CLONE_WINDOW': {
      const {
        windowId,
      } = action;
      const win = state.windows.find((w) => w.windowId === windowId);
      const newWindowId = generateWindowId(state);
      return {
        ...state,
        windows: [
          ...state.windows,
          {
            ...win,
            windowId: newWindowId,
            xPos: win.xPos + 15,
            yPos: win.yPos + 15,
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

    case 'MAXIMIZE_WINDOW': {
      const {
        windowId,
      } = action;
      const args = {
        ...state.args,
        0: state.args[windowId],
      };
      const { windowType, title } = state.windows.find((w) => w.windowId === windowId);
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
            windowOpen: true,
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
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          xPos: win.xPos + xDiff,
          yPos: win.yPos + yDiff,
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
          width: win.width + xDiff,
          height: win.height + yDiff,
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'CLOSE_ALL_WINDOWS': {
      return initialState;
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
