/**
 *
 * @flow
 */

import React, {
  useState, useEffect,
} from 'react';
import { connect } from 'react-redux';
import { MdForum } from 'react-icons/md';
import { t } from 'ttag';

import { openChatWindow } from '../actions';


const ChatButton = ({
  chatNotify,
  channels,
  unread,
  mute,
  open,
}) => {
  const [unreadAny, setUnreadAny] = useState(false);
  // TODO what do here?
  const chatOpen = false;
  const modalOpen = false;

  /*
   * almost the same as in ChannelDropDown
   * just cares about chatNotify too
   */
  useEffect(() => {
    if (!chatNotify || modalOpen || chatOpen) {
      setUnreadAny(false);
      return;
    }
    const cids = Object.keys(channels);
    let i = 0;
    while (i < cids.length) {
      const cid = cids[i];
      if (
        channels[cid][1] !== 0
        && unread[cid]
        && !mute.includes(cid)
      ) {
        setUnreadAny(true);
        break;
      }
      i += 1;
    }
    if (i === cids.length) {
      setUnreadAny(false);
    }
  });

  return (
    <div
      id="chatbutton"
      className="actionbuttons"
      onClick={open}
      role="button"
      title={(chatOpen) ? t`Close Chat` : t`Open Chat`}
      tabIndex={0}
    >
      {(unreadAny) && (
        <div
          style={{
            position: 'fixed',
            bottom: 27,
            right: 62,
            top: 'unset',
          }}
          className="chnunread"
        >⦿</div>
      )}
      <MdForum />
    </div>: null
  );
};

function mapDispatchToProps(dispatch) {
  return {
    open() {
      // dispatch(showChatModal(false));
      dispatch(openChatWindow());
    },
  };
}

function mapStateToProps(state) {
  const {
    chatNotify,
  } = state.audio;
  const {
    channels,
  } = state.chat;
  const {
    unread,
    mute,
  } = state.chatRead;
  return {
    channels,
    unread,
    mute,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatButton);
