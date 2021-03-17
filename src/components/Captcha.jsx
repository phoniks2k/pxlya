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

const Captcha = ({ callback, close }) => {
  const [captchaUrl, setCaptchaUrl] = useState(getUrl());
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div>
      {errors.map((error) => (
        <p key={error} className="errormessage">
          <span>{t`Error`}</span>:&nbsp;{error}
        </p>
      ))}
      <p className="modaltext">
        {t`Type the characters from the following image:`}
        <span style={{ fontSize: 11 }}>
          ({t`Tip: Not case-sensitive; I and l are the same`})
        </span>
      </p>
      <br />
      <div
        style={{
          width: '100%',
          paddingTop: '60%',
          position: 'relative',
        }}
      >
        <img
          style={{
            width: '100%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `scale(${(imgLoaded) ? '1' : '0'}) translate(-50%,-50%)`,
            transition: '100ms',
          }}
          src={captchaUrl}
          alt="CAPTCHA"
          onLoad={() => {setImgLoaded(true)}}
          onError={() => setErrors([t`Could not load captcha`])}
        />
      </div>
      <p className="modaltext">
        {t`Can't read? Reload:`}&nbsp;
        <span
          role="button"
          tabIndex={-1}
          title={t`Reload`}
          onClick={() => {
            setImgLoaded(false);
            setCaptchaUrl(getUrl());
          }}
        >
          <IoReloadCircleSharp />
        </span>
      </p>
      <input
        placeholder={t`I am human`}
        type="text"
        value={text}
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
            onClick={close}
          >
            {t`Cancel`}
          </button>
          <button
            type="button"
            onClick={async () => {
              const { errors: resErrors } = await requestSolveCaptcha(text);
              if (resErrors) {
                setCaptchaUrl(getUrl());
                setErrors(resErrors);
              } else {
                close();
              }
            }}
          >
            {t`Send`}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(Captcha);
