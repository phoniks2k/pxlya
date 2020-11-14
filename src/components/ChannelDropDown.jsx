/*
 * Drop Down menu for Chat Channel selection
 *
 * @flow
 */

import React, {
  useRef, useLayoutEffect, useState, useEffect,
} from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import {
  setChatChannel,
} from '../actions';

const ChannelDropDown = ({
  channels,
  chatChannel,
  setChannel,
}) => {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current 
        && !wrapperRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div
      style={{position: 'relative'}}
    >
      <div
        style={{
          width: 50,
        }}
        ref={wrapperRef}
        onClick={() => setShow(true)}
        className="channelbtn"
      >
        {chatChannel}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          display: (show) ? 'initial' : 'none',
        }}
        className="channeldd"
      >
        {
          channels.map((ch) => (
            <div>
              {ch[1]}
            </div>
          ))
        }
      </div>
    </div>
  );
};

function mapStateToProps(state: State) {
  const { chatChannel } = state.gui;
  const { channels } = state.chat;
  return {
    channels,
    chatChannel,
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
