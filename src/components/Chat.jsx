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
import { MAX_CHAT_MESSAGES } from '../core/constants';

import {
  showUserAreaModal,
  setChatChannel,
  fetchChatMessages,
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
  setChannel,
  fetchMessages,
  fetching,
}) => {
  const listRef = useRef();
  const inputRef = useRef();
  const [inputMessage, setInputMessage] = useState('');
  const [selection, setSelection] = useState(null);
  const [nameRegExp, setNameRegExp] = useState(null);

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

  useEffect(() => {
    // TODO this removes focus from chat box, fix this
    return;
    if (channelMessages.length === MAX_CHAT_MESSAGES) {
      restoreSelection(selection);
    }
  }, [channelMessages]);

  useEffect(() => {
    const regExp = (ownName)
      ? new RegExp(`(^|\\s)(@${escapeRegExp(ownName)})(\\s|$)`, 'g')
      : null;
    setNameRegExp(regExp);
  }, [ownName]);

  function padToInputMessage(txt) {
    const lastChar = inputMessage.substr(-1);
    const pad = (lastChar && lastChar !== ' ');
    let newMsg = inputMessage;
    if (pad) newMsg += ' ';
    newMsg += txt;
    setInputMessage(newMsg);
    inputRef.current.focus();
  }

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
            insertText={(txt) => padToInputMessage(txt)}
          />
          )
          }
        {
          channelMessages.map((message) => (
            <ChatMessage
              name={message[0]}
              msgArray={splitChatMessage(message[1], nameRegExp)}
              country={message[2]}
              insertText={(txt) => padToInputMessage(txt)}
            />
          ))
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
              ref={inputRef}
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
            <select
              style={{ flexGrow: 0 }}
              onChange={(evt) => {
                const sel = evt.target;
                setChannel(sel.options[sel.selectedIndex].value);
              }}
            >
              {
                channels.map((ch) => (
                  <option
                    // eslint-disable-next-line eqeqeq
                    selected={ch[0] == chatChannel}
                    value={ch[0]}
                  >
                    {ch[1]}
                  </option>
                ))
              }
            </select>
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
  );
};

function mapStateToProps(state: State) {
  const { name } = state.user;
  const { chatChannel } = state.gui;
  const { channels, messages, fetching } = state.chat;
  return {
    channels,
    messages,
    fetching,
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
