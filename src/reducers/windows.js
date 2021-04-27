/*
 * state for open windows and modal and its content
 *
 * @flow
 */

import type { Action } from '../actions/types';

export type WindowsState = {
  // modal is considerd as "fullscreen window"
  // its windowId is considered 0 and args are under args[0]
  modalOpen: boolean,
  modalType: ?string,
  // [
  //   {
  //     windowId: number,
  //     windowType: string,
  //     title: string,
  //     width: number,
  //     height: number,
  //     xPos: percentage,
  //     yPos: percentage,
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
  modalOpen: false,
  modalType: null,
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
        width,
        height,
        xPos,
        yPos,
        args,
      } = action;
      let windowId = Math.floor(Math.random() * 99999) + 1;
      while (state.args[windowId]) {
        windowId += 1;
      }
      return {
        ...state,
        windows: [
          ...state.windows,
          {
            windowId,
            windowType,
            title,
            width,
            height,
            xPos,
            yPos,
            args,
          },
        ],
        args: {
          ...state.args,
          [windowId]: args,
        },
      };
    }

    case 'CLOSE_WINDOW': {
      const {
        windowId,
      } = action;
      const args = { ...state.args };
      delete args[windowId];
      return {
        ...state,
        windows: state.windows.filter((win) => win.windowId !== windowId),
        args,
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
