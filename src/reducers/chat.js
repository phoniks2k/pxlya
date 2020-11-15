/* @flow */

import { MAX_CHAT_MESSAGES } from '../core/constants';

import type { Action } from '../actions/types';

export type ChatState = {
  inputMessage: string,
  // [[cid, name], [cid2, name2],...]
  channels: Array,
  // { cid: [message1,message2,message2,...]}
  messages: Object,
  // if currently fetching messages
  fetching: boolean,
}

const initialState: ChatState = {
  inputMessage: '',
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

    case 'ADD_CHAT_CHANNEL': {
      const { channel } = action;
      const channelId = channel[0];
      const channels = state.channels
        .filter((ch) => (ch[0] !== channelId));
      channels.push(channel);
      return {
        ...state,
        channels,
      };
    }

    case 'SET_CHAT_FETCHING': {
      const { fetching } = action;
      return {
        ...state,
        fetching,
      };
    }

    case 'SET_CHAT_INPUT_MSG': {
      const { message } = action;
      return {
        ...state,
        inputMessage: message,
      };
    }

    case 'ADD_CHAT_INPUT_MSG': {
      const { message } = action;
      let { inputMessage } = state;
      const lastChar = inputMessage.substr(-1);
      const pad = (lastChar && lastChar !== ' ');
      if (pad) {
        inputMessage += ' ';
      }
      inputMessage += message;

      return {
        ...state,
        inputMessage,
      };
    }

    case 'RECEIVE_CHAT_MESSAGE': {
      const {
        name, text, country, channel, user,
      } = action;
      if (!state.messages[channel]) {
        return state;
      }
      const messages = {
        ...state.messages,
        [channel]: [
          ...state.messages[channel],
          [name, text, country, user],
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
