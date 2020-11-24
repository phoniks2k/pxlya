/**
 *
 * @flow
 */

import React, {
  useRef, useLayoutEffect, useState, useEffect,
} from 'react';
import useStayScrolled from 'react-stay-scrolled';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import ChatMessage from './ChatMessage';
import ChannelDropDown from './ChannelDropDown';
import { MAX_CHAT_MESSAGES } from '../core/constants';

import {
  showUserAreaModal,
  setChatChannel,
  fetchChatMessages,
  setChatInputMessage,
} from '../actions';
import ProtocolClient from '../socket/ProtocolClient';
import { saveSelection, restoreSelection } from '../utils/storeSelection';
import splitChatMessage from '../core/chatMessageFilter';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const Chat = ({
  channels,
  messages,
  chatChannel,
  ownName,
  open,
  inputMessage,
  setInputMessage,
  setChannel,
  fetchMessages,
  fetching,
  blocked,
}) => {
  const listRef = useRef();
  const [selection, setSelection] = useState(null);
  const [nameRegExp, setNameRegExp] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);

  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
    inaccuracy: 10,
  });

  const channelMessages = messages[chatChannel] || [];
  if (!messages[chatChannel] && !fetching) {
    fetchMessages(chatChannel);
  }

  useLayoutEffect(() => {
    stayScrolled();
  }, [channelMessages.length]);

  /*
   * TODO this removes focus from chat box, fix this
   *
  useEffect(() => {
    if (channelMessages.length === MAX_CHAT_MESSAGES) {
      restoreSelection(selection);
    }
  }, [channelMessages]);
  */

  useEffect(() => {
    const regExp = (ownName)
      ? new RegExp(`(^|\\s)(@${escapeRegExp(ownName)})(\\s|$)`, 'g')
      : null;
    setNameRegExp(regExp);
  }, [ownName]);

  useEffect(() => {
    const bl = [];
    for (let i = 0; i < blocked.length; i += 1) {
      bl.push(blocked[i][0]);
    }
    setBlockedIds(bl);
  }, [blocked.length]);

  function handleSubmit(e) {
    e.preventDefault();
    const msg = inputMessage.trim();
    if (!msg) return;
    // send message via websocket
    ProtocolClient.sendChatMessage(msg, chatChannel);
    setInputMessage('');
  }

  /*
   * if selected channel isn't in channel list anymore
   * for whatever reason (left faction etc.)
   * set channel to first available one
   */
  let i = 0;
  while (i < channels.length) {
    // eslint-disable-next-line eqeqeq
    if (channels[i][0] == chatChannel) {
      break;
    }
    i += 1;
  }
  if (i && i === channels.length) {
    setChannel(channels[0][0]);
  }

  return (
    <div style={{ display: 'relative', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ul
          className="chatarea"
          ref={listRef}
          style={{ flexGrow: 1 }}
          onMouseUp={() => { setSelection(saveSelection); }}
          role="presentation"
        >
          {
            (!channelMessages.length)
            && (
            <ChatMessage
              name="info"
              msgArray={splitChatMessage('Start chatting here', nameRegExp)}
              country="xx"
              uid={0}
            />
            )
            }
          {
            channelMessages.map((message) => ((blockedIds.includes(message[3]))
              ? null : (
                <ChatMessage
                  name={message[0]}
                  msgArray={splitChatMessage(message[1], nameRegExp)}
                  country={message[2]}
                  uid={message[3]}
                />
              )))
          }
        </ul>
        {(ownName) ? (
          <div classNam="chatinput">
            <form
              onSubmit={(e) => handleSubmit(e)}
              style={{ display: 'flex', flexDirection: 'row' }}
            >
              <input
                style={{ flexGrow: 1, minWidth: 40 }}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                id="chatmsginput"
                maxLength="200"
                type="text"
                placeholder="Chat here"
              />
              <button
                style={{ flexGrow: 0 }}
                type="submit"
              >
                ‣
              </button>
              <ChannelDropDown />
            </form>
          </div>
        ) : (
          <div
            className="modallink"
            onClick={open}
            style={{ textAlign: 'center', fontSize: 13 }}
            role="button"
            tabIndex={0}
          >
            You must be logged in to chat
          </div>
        )}
      </div>
    </div>
  );
};

function mapStateToProps(state: State) {
  const { name } = state.user;
  const { chatChannel } = state.gui;
  const {
    channels,
    messages,
    inputMessage,
    blocked,
  } = state.chat;
  const {
    fetchingChat: fetching,
  } = state.fetching;
  return {
    channels,
    messages,
    fetching,
    blocked,
    inputMessage,
    chatChannel,
    ownName: name,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showUserAreaModal());
    },
    setChannel(channelId) {
      dispatch(setChatChannel(channelId));
    },
    fetchMessages(channelId) {
      dispatch(fetchChatMessages(channelId));
    },
    setInputMessage(message) {
      dispatch(setChatInputMessage(message));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
