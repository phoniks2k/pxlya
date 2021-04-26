/*
 *
 * @flow
 */

import React, {
  useRef, useEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import {
  hideContextMenu,
  addToChatInputMessage,
  startDm,
  setUserBlock,
  setChatChannel,
} from '../actions';

const UserContextMenu = ({
  setChannel,
}) => {
  const wrapperRef = useRef(null);

  const { xPos, yPos, args } = useSelector((state) => state.contextMenu);
  const { windowId, name, uid } = args;

  const channels = useSelector((state) => state.chat.channels);
  const fetching = useSelector((state) => state.fetching.fetchingApi);

  const dispatch = useDispatch();
  const close = () => dispatch(hideContextMenu());

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
          dispatch(addToChatInputMessage(windowId, `@${name} `));
          close();
        }}
        style={{ borderTop: 'none' }}
      >
        {t`Ping`}
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
              dispatch(setChatChannel(windowId, cid));
              close();
              return;
            }
          }
          if (!fetching) {
            dispatch(startDm(windowId, { userId: uid }));
          }
          close();
        }}
      >
        {t`DM`}
      </div>
      <div
        onClick={() => {
          dispatch(setUserBlock(uid, name, true));
          close();
        }}
        role="button"
        tabIndex={-1}
      >
        {t`Block`}
      </div>
    </div>
  );
};

export default UserContextMenu;
