/**
 *
 * @flow
 */

import React, {
  useRef, useLayoutEffect, useState, useEffect, useCallback,
} from 'react';
import useStayScrolled from 'react-stay-scrolled';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import ChatMessage from '../ChatMessage';
import ChannelDropDown from '../contextmenus/ChannelDropDown';

import {
  showUserAreaModal,
  setChatChannel,
  setChatInputMessage,
  fetchChatMessages,
  showContextMenu,
} from '../../actions';
import ProtocolClient from '../../socket/ProtocolClient';
import splitChatMessage from '../../core/chatMessageFilter';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const Chat = ({
  windowId,
}) => {
  const listRef = useRef();
  const targetRef = useRef();

  const [nameRegExp, setNameRegExp] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);
  const [btnSize, setBtnSize] = useState(20);

  const dispatch = useDispatch();

  const setChannel = useCallback((cid) => dispatch(
    setChatChannel(windowId, cid),
  ), [dispatch]);

  const ownName = useSelector((state) => state.user.name);
  // eslint-disable-next-line max-len
  const isDarkMode = useSelector((state) => state.gui.style.indexOf('dark') !== -1);
  const fetching = useSelector((state) => state.fetching.fetchingChat);
  const { channels, messages, blocked } = useSelector((state) => state.chat);
  // eslint-disable-next-line max-len
  const { chatChannel, inputMessage } = useSelector((state) => state.windows.args[windowId]);

  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
    inaccuracy: 10,
  });

  const channelMessages = messages[chatChannel] || [];
  if (channels[chatChannel] && !messages[chatChannel] && !fetching) {
    dispatch(fetchChatMessages(chatChannel));
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
    dispatch(setChatInputMessage(windowId, ''));
  }

  /*
   * if selected channel isn't in channel list anymore
   * for whatever reason (left faction etc.)
   * set channel to first available one
   */
  useEffect(() => {
    if (!chatChannel || !channels[chatChannel]) {
      const cids = Object.keys(channels);
      if (cids.length) {
        setChannel(cids[0]);
      }
    }
  }, [channels]);

  return (
    <div
      ref={targetRef}
      className="chat-container"
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
            dispatch(showContextMenu(
              'CHANNEL',
              clientX,
              clientY,
              { cid: chatChannel },
            ));
          }}
          role="button"
          title={t`Channel settings`}
          tabIndex={-1}
        >⚙</span>
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
            dark={isDarkMode}
            windowId={windowId}
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
                dark={isDarkMode}
                windowId={windowId}
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
              onChange={(e) => dispatch(
                setChatInputMessage(windowId, e.target.value),
              )}
              autoComplete="off"
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
            <ChannelDropDown
              setChatChannel={setChannel}
              chatChannel={chatChannel}
            />
          </form>
        </div>
      ) : (
        <div
          className="modallink"
          onClick={() => dispatch(showUserAreaModal())}
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

export default Chat;
