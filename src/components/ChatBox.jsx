/**
 *
 * @flow
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import useWindowSize from '../utils/reactHookResize';
import { showChatModal } from '../actions';

import Chat from './Chat';


const ChatBox = () => {
  const [render, setRender] = useState(false);

  const chatOpen = useSelector((state) => state.modal.chatOpen);

  const dispatch = useDispatch();

  useEffect(() => {
    window.setTimeout(() => {
      if (chatOpen) setRender(true);
    }, 10);
  }, [chatOpen]);

  const onTransitionEnd =() => {
    if (!chatOpen) setRender(false);
  };

  const { width } = useWindowSize();
  if (width < 604 && chatOpen) {
    dispatch(showChatModal(true));
  }

  return (
    (render || chatOpen) && (
      <div
        className={(chatOpen && render) ? 'chatbox show' : 'chatbox'}
        onTransitionEnd={onTransitionEnd}
      >
        <Chat showExpand />
      </div>
    )
  );
}

export default React.memo(ChatBox);
