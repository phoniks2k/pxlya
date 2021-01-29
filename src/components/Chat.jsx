/**
 *
 * @flow
 */

import React, {
  useRef, useLayoutEffect, useState, useEffect,
} from 'react';
import useStayScrolled from 'react-stay-scrolled';
import { connect } from 'react-redux';
import { t } from 'ttag';

import type { State } from '../reducers';
import ChatMessage from './ChatMessage';
import ChannelDropDown from './ChannelDropDown';

import {
  showUserAreaModal,
  showChatModal,
  setChatChannel,
  fetchChatMessages,
  setChatInputMessage,
  showContextMenu,
} from '../actions';
import ProtocolClient from '../socket/ProtocolClient';
import splitChatMessage from '../core/chatMessageFilter';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const Chat = ({
  showExpand,
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
  triggerModal,
  openChannelContextMenu,
}) => {
  const listRef = useRef();
  const targetRef = useRef();
  const [nameRegExp, setNameRegExp] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);
  const [btnSize, setBtnSize] = useState(20);

  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
    inaccuracy: 10,
  });

  const channelMessages = messages[chatChannel] || [];
  if (channels[chatChannel] && !messages[chatChannel] && !fetching) {
    fetchMessages(chatChannel);
  }

  useLayoutEffect(() => {
    stayScrolled();
  }, [channelMessages.length]);

  useEffect(() => {
    const regExp = (ownName)
      ? new RegExp(`(^|\\s)(@${escapeRegExp(ownName)})(\\s|$)`, 'g')
      : null;
    setNameRegExp(regExp);
  }, [ownName]);

  useEffect(() => {
    setTimeout(() => {
      const fontSize = Math.round(targetRef.current.offsetHeight / 10);
      setBtnSize(Math.min(28, fontSize));
    }, 330);
  }, [targetRef]);

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
  useEffect(() => {
    if (!channels[chatChannel]) {
      const cids = Object.keys(channels);
      if (cids.length) {
        setChannel(cids[0]);
      }
    }
  }, [chatChannel, channels]);

  return (
    <div
      ref={targetRef}
      style={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
      }}
    >
      <div
        className="chatlink"
        style={{
          fontSize: btnSize,
        }}
      >
        <span
          onClick={(event) => {
            const {
              clientX,
              clientY,
            } = event;
            openChannelContextMenu(
              clientX,
              clientY,
              chatChannel,
            );
          }}
          role="button"
          title={t`Channel settings`}
          tabIndex={-1}
        >⚙</span>
        &nbsp;
        {(showExpand)
          && (
          <span
            onClick={triggerModal}
            role="button"
            title={t`maximize`}
            tabIndex={-1}
          >↷</span>
          )}
      </div>
      <ul
        className="chatarea"
        ref={listRef}
        style={{ flexGrow: 1 }}
        role="presentation"
      >
        {
          (!channelMessages.length)
          && (
          <ChatMessage
            name="info"
            msgArray={splitChatMessage(t`Start chatting here`, nameRegExp)}
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
              autoComplete="off"
              id="chatmsginput"
              maxLength="200"
              type="text"
              placeholder={t`Chat here`}
            />
            <button
              id="sendbtn"
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
          {t`You must be logged in to chat`}
        </div>
      )}
    </div>
  );
};

function mapStateToProps(state: State) {
  const { name } = state.user;
  const { chatChannel } = state.chatRead;
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
    triggerModal() {
      dispatch(showChatModal(true));
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
    openChannelContextMenu(xPos, yPos, cid) {
      dispatch(showContextMenu('CHANNEL', xPos, yPos, {
        cid,
      }));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
