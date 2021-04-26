/*
 * local save state for chat stuff
 *
 * @flow
 */

import type { Action } from '../actions/types';

const TIME_DIFF_THREASHOLD = 15000;

export type ChatReadState = {
  // channels that are muted
  // [cid, cid2, ...]
  mute: Array,
  // timestamps of last read
  // {cid: lastTs, ...}
  readTs: Object,
  // booleans if channel is unread
  // {cid: unread, ...}
  unread: Object,
  // currently open chat channels can contain duplications
  // just used to keep track of what channels we are seeing in
  // windows to decide if readTS gets changed,
  chatChannels: Array,
};

const initialState: ChatReadState = {
  mute: [],
  readTs: {},
  unread: {},
  chatChannels: [],
};


export default function chatRead(
  state: ModalState = initialState,
  action: Action,
): ChatReadState {
  switch (action.type) {
    case 'RECEIVE_ME':
    case 'LOGIN': {
      const { channels } = action;
      const cids = Object.keys(channels);
      const readTs = {};
      const unread = {};
      for (let i = 0; i < cids.length; i += 1) {
        const cid = cids[i];
        if (!state.readTs[cid]) {
          readTs[cid] = 0;
        } else {
          readTs[cid] = state.readTs[cid];
        }
        unread[cid] = (channels[cid][2] > readTs[cid]);
      }
      return {
        ...state,
        readTs,
        unread,
      };
    }

    case 'OPEN_CHAT_CHANNEL': {
      const { cid } = action;
      return {
        ...state,
        chatChannels: [
          ...state.chatChannels,
          cid,
        ],
        readTs: {
          ...state.readTs,
          [cid]: Date.now() + TIME_DIFF_THREASHOLD,
        },
        unread: {
          ...state.unread,
          [cid]: false,
        },
      };
    }

    case 'CLOSE_CHAT_CHANNEL': {
      const { cid } = action;
      const chatChannels = [...state.chatChannels];
      const pos = chatChannels.indexOf(cid);
      if (pos !== -1) {
        chatChannels.splice(pos, 1);
      }
      return {
        ...state,
        chatChannels,
      };
    }

    case 'ADD_CHAT_CHANNEL': {
      const [cid] = Object.keys(action.channel);
      return {
        ...state,
        readTs: {
          ...state.readTs,
          [cid]: state.readTs[cid] || 0,
        },
        unread: {
          ...state.unread,
          [cid]: true,
        },
      };
    }

    case 'REMOVE_CHAT_CHANNEL': {
      const { cid } = action;
      if (!state.readTs[cid]) {
        return state;
      }
      const readTs = { ...state.readTs };
      delete readTs[cid];
      const unread = { ...state.unread };
      delete unread[cid];
      return {
        ...state,
        readTs,
        unread,
      };
    }

    case 'RECEIVE_CHAT_MESSAGE': {
      const { channel: cid } = action;
      const { chatChannels } = state;
      const readTs = chatChannels.includes(cid)
        ? {
          ...state.readTs,
          // 15s treshold for desync
          [cid]: Date.now() + TIME_DIFF_THREASHOLD,
        } : state.readTs;
      const unread = chatChannels.includes(cid)
        ? {
          ...state.unread,
          [cid]: true,
        } : state.unread;
      return {
        ...state,
        readTs,
        unread,
      };
    }

    case 'MUTE_CHAT_CHANNEL': {
      const { cid } = action;
      return {
        ...state,
        mute: [
          ...state.mute,
          cid,
        ],
      };
    }

    case 'UNMUTE_CHAT_CHANNEL': {
      const { cid } = action;
      const mute = state.mute.filter((id) => (id !== cid));
      return {
        ...state,
        mute,
      };
    }

    default:
      return state;
  }
}
