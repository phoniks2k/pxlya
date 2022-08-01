/*
 * Change Mail Form
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { t } from 'ttag';

import {
  setBlockingDm,
  setUserBlock,
} from '../store/actions';
import MdToggleButton from './MdToggleButton';

const SocialSettings = ({ done }) => {
  const blocked = useSelector((state) => state.chat.blocked);
  const blockDm = useSelector((state) => state.user.blockDm);
  const fetching = useSelector((state) => state.fetching.fetchingApi);
  const dispatch = useDispatch();

  return (
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
          {t`Block all Private Messages`}
        </span>
        <MdToggleButton
          value={blockDm}
          onToggle={() => {
            if (!fetching) {
              dispatch(setBlockingDm(!blockDm));
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
      >{t`Unblock Users`}</p>
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
            <p className="modaltext">{t`You have no users blocked`}</p>
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
