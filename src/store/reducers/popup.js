/*
 * state for single-window page (popup)
 */

import { argsTypes } from '../../components/windows/popUpAvailable';

function getWinDataFromURL() {
  const path = window.location.pathname.split('/').slice(1);
  /*
   * first part of path is windowType
   */
  const windowType = path[0].toUpperCase();
  /*
   * get args from path
   */
  const argsArr = path.slice(1);
  const args = {};
  const typeArr = argsTypes[windowType];
  if (typeArr) {
    let i = Math.min(typeArr.length, argsArr.length);
    while (i > 0) {
      i -= 1;
      args[typeArr[i]] = argsArr[i];
    }
  }
  /*
   * get args from query
   */
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  return {
    windowType,
    args: {
      ...args,
      ...params,
    },
  };
}

const initialState = {
  windowType: 'SETTINGS',
  title: '',
  args: {},
  isPopup: window.opener && !window.opener.closed,
  ...getWinDataFromURL(),
};

export default function popup(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'RELOAD_URL': {
      return {
        ...state,
        ...getWinDataFromURL(),
      };
    }

    case 'SET_WIN_ARGS': {
      return {
        ...state,
        args: {
          ...action.args,
        },
      };
    }

    default:
      return state;
  }
}
