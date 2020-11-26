/* @flow */

import { MAX_CHAT_MESSAGES } from '../core/constants';

import type { Action } from '../actions/types';

export type ChatState = {
  inputMessage: string,
  /*
   * {
   *   cid: [
   *     name,
   *     type,
   *     lastTs,
   *   ],
   *   cid2: [
   *     name,
   *     type,
   *     lastTs,
   *   ],
   *   ...
   * }
   */
  channels: Array,
  // [[uId, userName], [userId2, userName2],...]
  blocked: Array,
  // { cid: [message1,message2,message3,...]}
  messages: Object,
}

const initialState: ChatState = {
  inputMessage: '',
  channels: {},
  blocked: [],
  messages: {},
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
        blocked: action.blocked,
      };
    }

    case 'BLOCK_USER': {
      const { userId, userName } = action;
      return {
        ...state,
        blocked: [
          ...state.blocked,
          [userId, userName],
        ],
      };
    }

    case 'UNBLOCK_USER': {
      const { userId } = action;
      const blocked = state.blocked.filter((bl) => (bl[0] !== userId));
      return {
        ...state,
        blocked,
      };
    }

    case 'ADD_CHAT_CHANNEL': {
      const { channel } = action;
      return {
        ...state,
        channels: {
          ...state.channels,
          ...channel,
        },
      };
    }

    case 'REMOVE_CHAT_CHANNEL': {
      const { cid } = action;
      const channels = { ...state.channels };
      delete channels[cid];
      return {
        ...state,
        channels,
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
      if (!state.messages[channel] || !state.channels[channel]) {
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

      /*
       * update timestamp of last message
       */
      const channelArray = [...state.channels[channel]];
      channelArray[2] = Date.now();

      return {
        ...state,
        channels: {
          ...state.channels,
          [channel]: channelArray,
        },
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
