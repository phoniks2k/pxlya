/**
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import type { Action } from '../actions/types';

export type ContextMenuState = {
  menuOpen: boolean,
  menuType: ?string,
  xPos: number,
  yPos: number,
  args: Object,
};

const initialState: ContextMenuState = {
  menuOpen: false,
  menuType: null,
  xPos: 0,
  yPos: 0,
  args: {},
};


export default function contextMenu(
  state: ModalState = initialState,
  action: Action,
): ContextMenuState {
  switch (action.type) {
    case 'SHOW_CONTEXT_MENU': {
      const {
        menuType, xPos, yPos, args,
      } = action;
      // if the same context menu is already open, close it
      if (state.menuOpen && state.menuType === menuType
        && !(
          Object.keys(state.args).length === Object.keys(args).length
          && Object.keys(state.args).every(
            (key) => state.args[key] === args[key],
          )
        )) {
        return {
          ...state,
          menuOpen: false,
        };
      }
      return {
        ...state,
        menuType,
        xPos,
        yPos,
        menuOpen: true,
        args: {
          ...args,
        },
      };
    }

    case 'WINDOW_RESIZE':
    case 'HIDE_CONTEXT_MENU': {
      return {
        ...state,
        menuOpen: false,
      };
    }

    default:
      return state;
  }
}
