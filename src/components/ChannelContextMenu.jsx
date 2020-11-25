/*
 *
 * @flow
 */

import React, {
  useRef, useEffect, useState, useLayoutEffect,
} from 'react';
import { connect } from 'react-redux';

import {
  hideContextMenu,
  setLeaveChannel,
} from '../actions';
import type { State } from '../reducers';

const UserContextMenu = ({
  xPos,
  yPos,
  cid,
  channels,
  leave,
  close,
}) => {
  const wrapperRef = useRef(null);
  const [channelArray, setChannelArray] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        close();
      }
    };
    const handleWindowResize = () => close();
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('resize', handleWindowResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [wrapperRef]);

  useLayoutEffect(() => {
    for (let i = 0; i < channels.length; i += 1) {
      const chan = channels[i];
      /*
       * [cid, name, type, lastMessage]
       */
      // eslint-disable-next-line eqeqeq
      if (chan[0] == cid) {
        setChannelArray(chan);
        break;
      }
    }
  }, [channels.length]);

  return (
    <div
      ref={wrapperRef}
      className="contextmenu"
      style={{
        right: window.innerWidth - xPos,
        top: yPos,
      }}
    >
      <div>
        ✔✘ Mute
      </div>
      {(channelArray[2] !== 0)
        && (
        <div
          role="button"
          onClick={() => {
            leave(cid);
            close();
          }}
          tabIndex={0}
          style={{ borderTop: 'thin solid' }}
        >
          Close
        </div>
        )}
    </div>
  );
};

function mapStateToProps(state: State) {
  const {
    xPos,
    yPos,
    args,
  } = state.contextMenu;
  const {
    channels,
  } = state.chat;
  const {
    cid,
  } = args;
  return {
    xPos,
    yPos,
    cid,
    channels,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    close() {
      dispatch(hideContextMenu());
    },
    leave(cid) {
      dispatch(setLeaveChannel(cid));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserContextMenu);
