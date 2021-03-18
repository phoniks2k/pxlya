/* @flow */

import type { Action } from '../actions/types';

export type AlertState = {
  alertOpen: boolean,
  alertType: ?string,
  alertTitle: ?string,
  alertMessage: ?string,
  alertBtn: ?string,
};

const initialState: AlertState = {
  alertOpen: false,
  alertType: null,
  alertTitle: null,
  alertMessage: null,
  alertBtn: null,
};

export default function alert(
  state: AlertState = initialState,
  action: Action,
): AlertState {
  switch (action.type) {
    case 'ALERT': {
      const {
        title, text, icon, confirmButtonText,
      } = action;

      return {
        ...state,
        alertOpen: true,
        alertTitle: title,
        alertMessage: text,
        alertType: icon,
        alertBtn: confirmButtonText,
      };
    }

    case 'CLOSE_ALERT': {
      return {
        ...state,
        alertOpen: false,
      };
    }

    default:
      return state;
  }
}
