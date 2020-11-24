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
  close,
}) => {
  const wrapperRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
        style={{ borderBottom: 'thin solid' }}
        onClick={() => {
          block(uid, name);
          close();
        }}
      >
        Block
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          dm(uid);
          // TODO if DM Channel with user already exist, just switch
          close();
        }}
        style={{ borderBottom: 'thin solid' }}
      >
        DM
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          addToInput(`@${name} `);
          close();
        }}
      >
        Ping
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
    name,
    uid,
  } = args;
  return {
    xPos,
    yPos,
    name,
    uid,
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserContextMenu);
