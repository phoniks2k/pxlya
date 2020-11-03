/* @flow */

import { MAX_CHAT_MESSAGES } from '../core/constants';

import type { Action } from '../actions/types';

export type ChatState = {
  // [[cid, name], [cid2, name2],...]
  channels: Array,
  // { cid: [message1,message2,message2,...]}
  messages: Object,
  // if currently fetching messages
  fetching: boolean,
}

const initialState: ChatState = {
  channels: [],
  messages: {},
  fetching: false,
};

export default function chat(
  state: ChatState = initialState,
  action: Action,
): ChatState {
  switch (action.type) {
    case 'RECEIVE_ME': {
      return {
        ...state,
        channels: action.channels,
      };
    }

    case 'SET_CHAT_FETCHING': {
      const { fetching } = action;
      return {
        ...state,
        fetching,
      };
    }

    case 'RECEIVE_CHAT_MESSAGE': {
      const {
        name, text, country, channel,
      } = action;
      if (!state.messages[channel]) {
        return state;
      }
      const messages = {
        ...state.messages,
        [channel]: [
          ...state.messages[channel],
          [name, text, country],
        ],
      };
      if (messages[channel].length > MAX_CHAT_MESSAGES) {
        messages[channel].shift();
      }
      return {
        ...state,
        messages,
      };
    }

    case 'RECEIVE_CHAT_HISTORY': {
      const { cid, history } = action;
      return {
        ...state,
        messages: {
          ...state.messages,
          [cid]: history,
        },
      };
    }

    default:
      return state;
  }
}
