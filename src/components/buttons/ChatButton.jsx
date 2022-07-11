/**
 *
 * @flow
 */

import React, {
  useState, useEffect,
} from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { MdForum } from 'react-icons/md';
import { t } from 'ttag';

import {
  hideAllWindowTypes,
  openChatWindow,
} from '../../store/actions';

/*
 * return [ showWindows, chatOpen, chatHiden ]
 *   showWindows: if windows are enabled (false on small screens)
 *   chatOpen: if any chat window or modal is open
 *   chatHidden: if any chat windows are hidden
 */
const selectChatWindowStatus = (state) => [
  state.windows.showWindows,
  state.windows.windows.find((win) => win.windowType === 'CHAT'
    && win.hidden === false)
  || (state.windows.modal.open && state.windows.modal.windowType === 'CHAT'),
  state.windows.windows.find((win) => win.windowType === 'CHAT'
    && win.hidden === true),
];

const ChatButton = () => {
  const [unreadAny, setUnreadAny] = useState(false);

  const dispatch = useDispatch();

  const [showWindows, chatOpen, chatHidden] = useSelector(
    selectChatWindowStatus,
    shallowEqual,
  );

  const chatNotify = useSelector((state) => state.audio.chatNotify);
  const channels = useSelector((state) => state.chat.channels);
  const [unread, mute] = useSelector((state) => [
    state.chatRead.unread,
    state.chatRead.mute,
  ], shallowEqual);

  /*
   * almost the same as in ChannelDropDown
   * just cares about chatNotify too
   */
  useEffect(() => {
    if (!chatNotify || chatOpen) {
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
      onClick={() => {
        if (chatOpen) {
          dispatch(hideAllWindowTypes('CHAT', true));
        } else if (chatHidden && showWindows) {
          dispatch(hideAllWindowTypes('CHAT', false));
        } else {
          dispatch(openChatWindow());
        }
      }}
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

export default React.memo(ChatButton);
