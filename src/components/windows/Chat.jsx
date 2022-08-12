/**
 *
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
  fetchChatMessages,
  showContextMenu,
  setWindowTitle,
  setWindowArgs,
  markChannelAsRead,
} from '../../store/actions';
import SocketClient from '../../socket/SocketClient';


const Chat = ({
  windowId,
}) => {
  const listRef = useRef();
  const targetRef = useRef();

  const [blockedIds, setBlockedIds] = useState([]);
  const [btnSize, setBtnSize] = useState(20);

  const dispatch = useDispatch();

  const setChannel = useCallback((cid) => {
    dispatch(markChannelAsRead(cid));
    dispatch(setWindowArgs(windowId, {
      chatChannel: Number(cid),
    }));
  }, [dispatch]);

  const setChatInputMessage = useCallback((msg) => {
    dispatch(setWindowArgs(windowId, {
      inputMessage: msg,
    }));
  }, [dispatch]);

  const ownName = useSelector((state) => state.user.name);
  // eslint-disable-next-line max-len
  const fetching = useSelector((state) => state.fetching.fetchingChat);
  const { channels, messages, blocked } = useSelector((state) => state.chat);

  const {
    chatChannel = 1,
    inputMessage = '',
  } = useSelector((state) => state.windows.args[windowId]);

  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
    inaccuracy: 10,
  });

  const channelMessages = messages[chatChannel] || [];
  useEffect(() => {
    if (channels[chatChannel] && !messages[chatChannel] && !fetching) {
      dispatch(fetchChatMessages(chatChannel));
    }
  }, [channels, messages, chatChannel]);

  useEffect(() => {
    if (channels[chatChannel]) {
      const channelName = channels[chatChannel][0];
      dispatch(setWindowTitle(windowId, `Chan: ${channelName}`));
    }
  }, [chatChannel]);

  useLayoutEffect(() => {
    stayScrolled();
  }, [channelMessages.length]);

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

  function handleSubmit(evt) {
    evt.preventDefault();
    const inptMsg = inputMessage.trim();
    if (!inptMsg) return;
    // send message via websocket
    SocketClient.sendChatMessage(inptMsg, chatChannel);
    dispatch(setChatInputMessage(''));
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
            uid={0}
            name="info"
            country="xx"
            msg={t`Start chatting here`}
            windowId={windowId}
          />
          )
          }
        {
          channelMessages.map((message) => ((blockedIds.includes(message[3]))
            ? null : (
              <ChatMessage
                name={message[0]}
                msg={message[1]}
                country={message[2]}
                uid={message[3]}
                ts={message[4]}
                key={message[5]}
                windowId={windowId}
              />
            )))
        }
      </ul>
      <form
        className="chatinput"
        onSubmit={(e) => handleSubmit(e)}
        style={{
          display: 'flex',
        }}
      >
        {(ownName) ? (
          <React.Fragment key={`chtipt-${windowId}`}>
            <input
              style={{
                flexGrow: 1,
                minWidth: 40,
              }}
              id={`chtipt-${windowId}`}
              value={inputMessage}
              onChange={(e) => dispatch(
                setChatInputMessage(e.target.value),
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
          </React.Fragment>
        ) : (
          <div
            className="modallink"
            onClick={() => dispatch(showUserAreaModal())}
            style={{
              textAlign: 'center',
              fontSize: 13,
              flexGrow: 1,
            }}
            role="button"
            tabIndex={0}
          >
            {t`You must be logged in to chat`}
          </div>
        )}
        <ChannelDropDown
          setChatChannel={setChannel}
          chatChannel={chatChannel}
        />
      </form>
    </div>
  );
};

export default Chat;
