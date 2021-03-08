/*
 * Form to ask for captcha.
 * If callback is provided, it sets the captcha text to it.
 * If callback is not provided, it provides a button to send the
 * captcha itself
 * @flow
 */

import React, { useState } from 'react';
import { t } from 'ttag';

import { IoReloadCircleSharp } from 'react-icons/io5';
import { requestSolveCaptcha } from '../actions/fetch';

function getUrl() {
  return `${window.ssv.captchaurl}/captcha.svg?${new Date().getTime()}`;
}

const Captcha = ({ callback, cancel }) => {
  const [captchaUrl, setCaptchaUrl] = useState(getUrl());
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  return (
    <div>
      <p className="modaltext">
        {t`Type the characters from the following image:`}
        <span style={{ fontSize: 11 }}>
          ({t`Tip: Not case-sensitive; I and l are the same`})
        </span>
      </p>
      <img
        style={{ width: '75%' }}
        src={captchaUrl}
        onError={() => setError(true)}
      />
      <p className="modaltext">
        {t`Can't read? Reload:`}&nbsp;
        <span
          role="button"
          tabIndex={-1}
          title={t`Reload`}
          onClick={() => setCaptchaUrl(getUrl())}
        >
          <IoReloadCircleSharp />
        </span>
      </p>
      <input
        placeholder={t`I am human`}
        type="text"
        value={text}
        autoFocus
        autoComplete="off"
        style={{ width: '5em' }}
        onChange={(evt) => {
          const txt = evt.target.value;
          setText(txt);
          if (callback) callback(txt);
        }}
      />
      {(!callback) && (
        <div>
          <button
            type="button"
            onClick={cancel}
          >
            {t`Cancel`}
          </button>
          <button
            type="button"
          >
            {t`Send`}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(Captcha);
