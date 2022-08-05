/*
 * get information about ban
 */

import React, { useState } from 'react';
import { t } from 'ttag';

import useInterval from './hooks/interval';
import {
  largeDurationToString,
} from '../core/utils';
import { requestBanInfo } from '../store/actions/fetch';


const BanInfo = ({ close }) => {
  const [errors, setErrors] = useState([]);
  const [reason, setReason] = useState('');
  const [expireTs, setExpireTs] = useState(0);
  const [expire, setExpire] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    const info = await requestBanInfo();
    setSubmitting(false);
    if (info.errors) {
      setErrors(info.errors);
      return;
    }
    const {
      ts,
      reason: newReason,
    } = info;
    setExpireTs(ts);
    const tsDate = new Date(ts);
    setExpire(tsDate.toLocaleString);
    setReason(newReason);
  };

  useInterval(() => {
    console.log('do');
    if (expireTs) {
      setExpireTs(expireTs - 1);
    }
  }, 1000);

  return (
    <div>
      {errors.map((error) => (
        <p key={error} className="errormessage">
          <span>{t`Error`}</span>:&nbsp;{error}
        </p>
      ))}
      {(reason) && (
        <>
          <h3 className="modaltitle">{t`Reason`}:</h3>
          <p className="modaltext">{reason}</p>
        </>
      )}
      {(expireTs) && (
        <>
          <h3 className="modaltitle">{t`Duration`}:</h3>
          <p className="modaltext">
            {t`Your ban expires at `}
            <span style={{ fontWeight: 'bold' }}>{expire}</span>
            {t` which is in `}
            <span
              style={{ fontWeight: 'bold' }}
            >
              {largeDurationToString(expireTs)}
            </span>
          </p>
        </>
      )}
      <p>
        <button
          type="button"
          style={{ fontSize: 16 }}
          onClick={handleSubmit}
        >
          {(submitting) ? '...' : t`Why?`}
        </button>
       &nbsp;
        <button
          type="submit"
          style={{ fontSize: 16 }}
          onClick={close}
        >
          {t`OK`}
        </button>
      </p>
    </div>
  );
};

export default React.memo(BanInfo);
