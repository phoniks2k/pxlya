/**
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import type { Action } from '../actions/types';

export type ModalState = {
  modalOpen: boolean,
  modalType: ?string,
  chatOpen: boolean,
};

const initialState: ModalState = {
  modalOpen: false,
  modalType: null,
  chatOpen: false,
};


export default function modal(
  state: ModalState = initialState,
  action: Action,
): ModalState {
  switch (action.type) {
    case 'SHOW_MODAL': {
      const { modalType } = action;
      const chatOpen = (modalType === 'CHAT') ? false : state.chatOpen;
      return {
        ...state,
        modalType,
        chatOpen,
        modalOpen: true,
      };
    }

    case 'SELECT_CANVAS':
    case 'HIDE_MODAL':
      return {
        ...state,
        modalOpen: false,
      };

    case 'TOGGLE_CHAT_BOX': {
      return {
        ...state,
        chatOpen: !state.chatOpen,
      };
    }

    case 'RECEIVE_ME': {
      const { name } = action;
      const chatOpen = (name) ? state.chatOpen : false;
      return {
        ...state,
        chatOpen,
      };
    }

    default:
      return state;
  }
}
