/*
 * Drop Down menu for Chat Channel selection
 *
 * @flow
 */

import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import { connect } from 'react-redux';
import { MdChat } from 'react-icons/md';
import { FaUserFriends } from 'react-icons/fa';

import type { State } from '../reducers';
import {
  setChatChannel,
} from '../actions';

const ChannelDropDown = ({
  channels,
  chatChannel,
  chatRead,
  setChannel,
}) => {
  const [show, setShow] = useState(false);
  // 0: global and faction  channels
  // 1: DMs
  const [type, setType] = useState(0);
  const [offset, setOffset] = useState(0);
  const [chatChannelName, setChatChannelName] = useState('...');
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setOffset(buttonRef.current.clientHeight);
  }, [buttonRef]);

  const handleClickOutside = useCallback((event) => {
    if (wrapperRef.current
      && !wrapperRef.current.contains(event.target)
      && !buttonRef.current.contains(event.target)
    ) {
      setShow(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    }
  }, [show]);

  useEffect(() => {
    for (let i = 0; i < channels.length; i += 1) {
      if (channels[i][0] === chatChannel) {
        setChatChannelName(channels[i][1]);
      }
    }
  }, [chatChannel, channels]);

  return (
    <div
      style={{ position: 'relative' }}
    >
      <div
        ref={buttonRef}
        style={{
          width: 50,
        }}
        onClick={() => setShow(!show)}
        className="channelbtn"
      >
        {chatChannelName}
      </div>
      {(show)
        && (
        <div
          ref={wrapperRef}
          style={{
            position: 'absolute',
            bottom: offset + 5,
            right: 9,
          }}
          className="channeldd"
        >
          <div>
            <span
              onClick={() => setType(0)}
            >
              <MdChat />
            </span>
            |
            <span
              onClick={() => setType(1)}
            >
              <FaUserFriends />
            </span>
          </div>
          <div
            className="channeldds"
          >
            {
              channels.filter((ch) => {
                const chType = ch[2];
                if (type === 1 && chType === 1) {
                  return true;
                }
                if (type === 0 && chType !== 1) {
                  return true;
                }
                return false;
              }).map((ch) => (
                <div
                  onClick={() => setChannel(ch[0])}
                  style={(ch[0] === chatChannel) ? {
                    fontWeight: 'bold',
                    fontSize: 17,
                  } : null}
                  className={
                    `chn${
                      (ch[0] === chatChannel) ? ' selected' : ''
                    }${
                      (chatRead[ch[0]] < ch[3]) ? ' unread' : ''
                    }`
                  }
                >
                  {ch[1]}
                </div>
              ))
            }
          </div>
        </div>
        )}
    </div>
  );
};

function mapStateToProps(state: State) {
  const {
    chatChannel,
    chatRead,
  } = state.gui;
  const { channels } = state.chat;
  return {
    channels,
    chatChannel,
    chatRead,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setChannel(channelId) {
      dispatch(setChatChannel(channelId));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelDropDown);
