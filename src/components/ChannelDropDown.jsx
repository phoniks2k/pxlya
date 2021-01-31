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
  unread,
  chatNotify,
  mute,
  setChannel,
}) => {
  const [show, setShow] = useState(false);
  const [sortChans, setSortChans] = useState([]);
  // 0: global and faction  channels
  // 1: DMs
  const [type, setType] = useState(0);
  const [offset, setOffset] = useState(0);
  const [unreadAny, setUnreadAny] = useState(false);
  const [chatChannelName, setChatChannelName] = useState('...');
  const [hasDm, setHasDm] = useState(false);
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

  const handleWindowResize = useCallback(() => {
    setShow(false);
  }, []);

  useLayoutEffect(() => {
    if (show) {
      if (channels[chatChannel]) {
        const chType = (channels[chatChannel][1] === 1) ? 1 : 0;
        setType(chType);
      }
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('resize', handleWindowResize);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', handleWindowResize);
    }
  }, [show]);

  useEffect(() => {
    const cids = Object.keys(channels);
    const sortChansNew = [];
    let i = 0;
    while (i < cids.length) {
      const cid = cids[i];
      const unreadCh = unread[cid] && !mute.includes(cid);
      // [cid, unread, name, type, lastTs, dmuid]
      sortChansNew.push([cid, unreadCh, ...channels[cid]]);
      if (
        !unreadAny
        && channels[cid][1] !== 0
        && unreadCh
      ) {
        setUnreadAny(true);
      }
      i += 1;
    }
    // latest lastTs first
    sortChansNew.sort((c1, c2) => {
      // determins if default channels get sorted too
      if (c1[3] === 0 || c2[3] === 0) return 0;
      if (c1[4] > c2[4]) return -1;
      if (c2[4] > c1[4]) return 1;
      return 0;
    });
    // unread first
    sortChansNew.sort((c1, c2) => {
      if (c1[3] === 0 || c2[3] === 0) return 0;
      if (c1[1] && !c2[1]) return -1;
      if (c2[1] && !c1[1]) return 1;
      return 0;
    });
    setSortChans(sortChansNew);
    if (i === cids.length) {
      setUnreadAny(false);
    }
  }, [channels, unread]);

  useEffect(() => {
    const cids = Object.keys(channels);
    for (let i = 0; i < cids.length; i += 1) {
      if (channels[cids[i]][1] === 1) {
        setHasDm(true);
        return;
      }
    }
    setHasDm(false);
  }, [channels]);

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
        role="button"
        tabIndex={-1}
        onClick={() => setShow(!show)}
        className={`channelbtn${(show) ? ' selected' : ''}`}
      >
        {(unreadAny && chatNotify && !show) && (
          <div style={{ top: -4 }} className="chnunread">⦿</div>
        )}
        {chatChannelName}
      </div>
      {(show)
        && (
        <div
          ref={wrapperRef}
          style={{
            position: 'absolute',
            bottom: offset,
            right: 9,
          }}
          className="channeldd"
        >
          <div
            className="chntop"
          >
            <span
              style={{ borderLeft: 'none' }}
              className={`chntype${(type === 0) ? ' selected' : ''}`}
              onClick={() => setType(0)}
              role="button"
              tabIndex={-1}
            >
              <MdChat />
            </span>
            {(hasDm)
              && (
              <span
                className={
                  `chntype${
                    (type === 1) ? ' selected' : ''
                  }`
                }
                onClick={() => setType(1)}
                role="button"
                tabIndex={-1}
              >
                {(unreadAny && chatNotify && type !== 1) && (
                  <div className="chnunread">⦿</div>
                )}
                <FaUserFriends />
              </span>
              )}
          </div>
          <div
            className="channeldds"
          >
            {
              sortChans.filter((ch) => {
                const chType = ch[3];
                if (type === 1 && chType === 1) {
                  return true;
                }
                if (type === 0 && chType !== 1) {
                  return true;
                }
                return false;
              }).map((ch) => {
                const [cid, unreadCh, name] = ch;
                return (
                  <div
                    onClick={() => setChannel(cid)}
                    className={
                      `chn${
                        (cid === chatChannel) ? ' selected' : ''
                      }`
                    }
                    role="button"
                    tabIndex={-1}
                  >
                    {
                      (unreadCh && chatNotify) ? (
                        <div className="chnunread">⦿</div>
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
  const { channels } = state.chat;
  const {
    chatChannel,
    unread,
    mute,
  } = state.chatRead;
  const { chatNotify } = state.audio;
  return {
    channels,
    chatChannel,
    unread,
    mute,
    chatNotify,
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
