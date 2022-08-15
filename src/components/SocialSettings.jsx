/*
 * Change Mail Form
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { t } from 'ttag';

import {
  setBlockingDm,
  setUserBlock,
} from '../store/actions/thunks';
import SettingsItem from './SettingsItem';

const SocialSettings = ({ done }) => {
  const blocked = useSelector((state) => state.chat.blocked);
  const blockDm = useSelector((state) => state.user.blockDm);
  const fetching = useSelector((state) => state.fetching.fetchingApi);
  const dispatch = useDispatch();

  return (
    <div className="inarea">
      <SettingsItem
        title={t`Block all Private Messages`}
        value={blockDm}
        onToggle={() => {
          if (!fetching) {
            dispatch(setBlockingDm(!blockDm));
          }
        }}
      />
      <h3
        style={{
          textAlign: 'left',
          marginLeft: 10,
        }}
      >{t`Unblock Users`}</h3>
      {
        (blocked.length) ? (
          <span
            className="unblocklist"
          >
            {
            blocked.map((bl) => (
              <div
                key={bl[0]}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!fetching) {
                    dispatch(setUserBlock(bl[0], bl[1], false));
                  }
                }}
              >
                {`⦸ ${bl[1]}`}
              </div>
            ))
          }
          </span>
        )
          : (
            <p>{t`You have no users blocked`}</p>
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
};

export default React.memo(SocialSettings);
