/*
 *
 * @flow
 */

import React, {
  useRef, useEffect,
} from 'react';
import { connect } from 'react-redux';

import {
  hideContextMenu,
  addToChatInputMessage,
  startDm,
  setUserBlock,
  setChatChannel,
} from '../actions';
import type { State } from '../reducers';

const UserContextMenu = ({
  xPos,
  yPos,
  uid,
  name,
  addToInput,
  dm,
  block,
  channels,
  fetching,
  setChannel,
  close,
}) => {
  const wrapperRef = useRef(null);


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

  return (
    <div
      ref={wrapperRef}
      className="contextmenu"
      style={{
        left: xPos,
        top: yPos,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          addToInput(`@${name} `);
          close();
        }}
        style={{ borderTop: 'none' }}
      >
        Ping
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          /*
           * if dm channel already exists,
           * just switch
           */
          const cids = Object.keys(channels);
          for (let i = 0; i < cids.length; i += 1) {
            const cid = cids[i];
            if (channels[cid].length === 4 && channels[cid][3] === uid) {
              setChannel(cid);
              close();
              return;
            }
          }
          if (!fetching) {
            dm(uid);
          }
          close();
        }}
      >
        DM
      </div>
      <div
        onClick={() => {
          block(uid, name);
          close();
        }}
        role="button"
        tabIndex={-1}
      >
        Block
      </div>
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
    name,
    uid,
  } = args;
  const {
    fetchingApi: fetching,
  } = state.fetching;
  return {
    xPos,
    yPos,
    channels,
    name,
    uid,
    fetching,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addToInput(text) {
      dispatch(addToChatInputMessage(text));
      const input = document.getElementById('chatmsginput');
      if (input) {
        input.focus();
        input.select();
      }
    },
    dm(userId) {
      dispatch(startDm({ userId }));
    },
    block(userId, userName) {
      dispatch(setUserBlock(userId, userName, true));
    },
    close() {
      dispatch(hideContextMenu());
    },
    setChannel(channelId) {
      dispatch(setChatChannel(channelId));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserContextMenu);
