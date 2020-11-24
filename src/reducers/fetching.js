/*
 * keeps track of some api fetching states
 *
 * @flow
 */

import type { Action } from '../actions/types';

export type FetchingState = {
  fetchingChunks: number,
  fetchingChat: boolean,
  fetchinApi: boolean,
}

const initialState: FetchingState = {
  fetchingChunks: 0,
  fetchingChat: false,
  fetchinApi: false,
};

export default function fetching(
  state: FetchingState = initialState,
  action: Action,
): FetchingState {
  switch (action.type) {
    case 'SET_CHAT_FETCHING': {
      const { fetching: fetchingChat } = action;
      return {
        ...state,
        fetchingChat,
      };
    }

    case 'SET_API_FETCHING': {
      const { fetching: fetchinApi } = action;
      return {
        ...state,
        fetchinApi,
      };
    }

    case 'REQUEST_BIG_CHUNK': {
      const {
        fetchingChunks,
      } = state;

      return {
        ...state,
        fetchingChunks: fetchingChunks + 1,
      };
    }

    case 'RECEIVE_BIG_CHUNK': {
      const { fetchingChunks } = state;

      return {
        ...state,
        fetchingChunks: fetchingChunks - 1,
      };
    }

    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      const { fetchingChunks } = state;

      return {
        ...state,
        fetchingChunks: fetchingChunks - 1,
      };
    }

    default:
      return state;
  }
}
