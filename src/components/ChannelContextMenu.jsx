/*
 *
 * @flow
 */

import React, {
  useRef, useEffect,
} from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import {
  hideContextMenu,
  setLeaveChannel,
  muteChatChannel,
  unmuteChatChannel,
} from '../actions';
import type { State } from '../reducers';

const ChannelContextMenu = ({
  xPos,
  yPos,
  cid,
  channels,
  leave,
  muteArr,
  mute,
  unmute,
  close,
}) => {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('click', handleClickOutside, {
      capture: true,
    });
    return () => {
      document.removeEventListener('click', handleClickOutside, {
        capture: true,
      });
    };
  }, [wrapperRef]);

  const isMuted = muteArr.includes(cid);

  return (
    <div
      ref={wrapperRef}
      className="contextmenu"
      style={{
        right: window.innerWidth - xPos,
        top: yPos,
      }}
    >
      <div
        role="button"
        onClick={() => {
          if (isMuted) {
            unmute(cid);
          } else {
            mute(cid);
          }
        }}
        tabIndex={0}
        style={{ borderTop: 'none' }}
      >
        {`${(isMuted) ? '✔' : '✘'} ${t`Mute`}`}
      </div>
      {(channels[cid][1] !== 0)
        && (
        <div
          role="button"
          onClick={() => {
            leave(cid);
            close();
          }}
          tabIndex={0}
        >
          {t`Close`}
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
  const { mute: muteArr } = state.chatRead;
  return {
    xPos,
    yPos,
    cid,
    channels,
    muteArr,
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
    mute(cid) {
      dispatch(muteChatChannel(cid));
    },
    unmute(cid) {
      dispatch(unmuteChatChannel(cid));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelContextMenu);
