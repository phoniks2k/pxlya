/*
 * Change Mail Form
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import {
  setBlockingDm,
  setUserBlock,
} from '../actions';
import MdToggleButtonHover from './MdToggleButtonHover';

const SocialSettings = ({
  blocked,
  fetching,
  blockDm,
  setBlockDm,
  unblock,
  done,
}) => (
  <div className="inarea">
    <div
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        margin: 10,
      }}
    >
      <span
        style={{
          flex: 'auto',
          textAlign: 'left',
        }}
        className="modaltitle"
      >
        Block all Private Messages
      </span>
      <MdToggleButtonHover
        value={blockDm}
        onToggle={() => {
          if (!fetching) {
            setBlockDm(!blockDm);
          }
        }}
      />
    </div>
    <div className="modaldivider" />
    <p
      style={{
        textAlign: 'left',
        marginLeft: 10,
      }}
      className="modaltitle"
    >Unblock Users</p>
    {
      (blocked.length) ? (
        <span
          className="unblocklist"
        >
          {
          blocked.map((bl) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!fetching) {
                  unblock(bl[0], bl[1]);
                }
              }}
            >
              {bl[1]}
            </div>
          ))
        }
        </span>
      )
        : (
          <p className="modaltext">You have no users blocked</p>
        )
    }
    <div className="modaldivider" />
    <button
      type="button"
      onClick={done}
      style={{ margin: 10 }}
    >
      Done
    </button>
  </div>
);

function mapStateToProps(state: State) {
  const { blocked } = state.chat;
  const { blockDm } = state.user;
  const { fetchingApi: fetching } = state.fetching;
  return {
    blocked,
    blockDm,
    fetching,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setBlockDm(block) {
      dispatch(setBlockingDm(block));
    },
    unblock(userId, userName) {
      dispatch(setUserBlock(userId, userName, false));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SocialSettings);
