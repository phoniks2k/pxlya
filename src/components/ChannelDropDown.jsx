/*
 * Drop Down menu for Chat Channel selection
 *
 * @flow
 */

import React, {
  useRef, useState, useEffect, useCallback, useLayoutEffect,
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

  useLayoutEffect(() => {
    if (show) {
      if (channels[chatChannel]) {
        const chType = (channels[chatChannel][1] === 1) ? 1 : 0;
        setType(chType);
      }
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    }
  }, [show]);

  useEffect(() => {
    if (channels[chatChannel]) {
      setChatChannelName(channels[chatChannel][0]);
    }
  }, [chatChannel]);

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
              Object.keys(channels).filter((cid) => {
                const chType = channels[cid][1];
                if (type === 1 && chType === 1) {
                  return true;
                }
                if (type === 0 && chType !== 1) {
                  return true;
                }
                return false;
              }).map((cid) => {
                const [name,, lastTs] = channels[cid];
                console.log(`name ${name} lastTC ${lastTs} compare to ${chatRead[cid]}`);
                return (
                  <div
                    onClick={() => setChannel(cid)}
                    className={
                      `chn${
                        (cid === chatChannel) ? ' selected' : ''
                      }`
                    }
                  >
                    {
                      (chatRead[cid] < lastTs) ? (
                        <span className="chnunread">※</span>
                      ) : null
                    }
                    {name}
                  </div>
                );
              })
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
