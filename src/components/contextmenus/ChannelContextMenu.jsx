/*
 *
 */

import React, { useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import {
  useClickOutside,
} from '../hooks/clickOutside';
import {
  hideContextMenu,
  muteChatChannel,
  unmuteChatChannel,
} from '../../store/actions';
import {
  setLeaveChannel,
} from '../../store/actions/thunks';

const ChannelContextMenu = () => {
  const wrapperRef = useRef(null);

  const channels = useSelector((state) => state.chat.channels);
  const muteArr = useSelector((state) => state.chatRead.mute);
  const { xPos, yPos, args } = useSelector((state) => state.contextMenu);
  const { cid } = args;
  const dispatch = useDispatch();
  const close = useCallback(() => dispatch(hideContextMenu()), [dispatch]);

  useClickOutside([wrapperRef], close);

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
            dispatch(unmuteChatChannel(cid));
          } else {
            dispatch(muteChatChannel(cid));
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
            dispatch(setLeaveChannel(cid));
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

export default React.memo(ChannelContextMenu);
