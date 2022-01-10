/*
 * Form to ask for captcha.
 * If callback is provided, it sets the captcha text to it.
 * If callback is not provided, it provides a button to send the
 * captcha itself
 * @flow
 */

/* eslint-disable jsx-a11y/no-autofocus */

import React, { useState, useEffect } from 'react';
import { t } from 'ttag';

import { IoReloadCircleSharp } from 'react-icons/io5';
import { requestSolveCaptcha } from '../actions/fetch';

async function getUrlAndId() {
  const url = window.ssv.captchaurl;
  const resp = await fetch(url, {
    cache: 'no-cache',
  });
  if (resp.ok) {
    const captchaid = resp.headers.get('captcha-id');
    const svgBlob = await resp.blob();
    return [URL.createObjectURL(svgBlob), captchaid];
  }
  return null;
}

const Captcha = ({ callback, close }) => {
  const [captchaData, setCaptchaData] = useState({});
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(async () => {
    const [svgUrl, captchaid] = await getUrlAndId();
    setCaptchaData({ url: svgUrl, id: captchaid });
  }, []);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const { errors: resErrors } = await requestSolveCaptcha(
          text,
          captchaData.id,
        );
        if (resErrors) {
          const [svgUrl, captchaid] = await getUrlAndId();
          setCaptchaData({ url: svgUrl, id: captchaid });
          setText('');
          setErrors(resErrors);
        } else {
          close();
        }
      }}
    >
      {errors.map((error) => (
        <p key={error} className="errormessage">
          <span>{t`Error`}</span>:&nbsp;{error}
        </p>
      ))}
      <p className="modaltext">
        {t`Type the characters from the following image:`}
        &nbsp;
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
        {(captchaData.url) && (
          <img
            style={{
              width: '100%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              opacity: (imgLoaded) ? 1 : 0,
              transform: 'translate(-50%,-50%)',
              transition: '100ms',
            }}
            src={captchaData.url}
            alt="CAPTCHA"
            onLoad={() => { setImgLoaded(true); }}
            onError={() => setErrors([t`Could not load captcha`])}
          />
        )}
      </div>
      <p className="modaltext">
        {t`Can't read? Reload:`}&nbsp;
        <span
          role="button"
          tabIndex={-1}
          title={t`Reload`}
          className="modallink"
          style={{ fontSize: 28 }}
          onClick={async () => {
            setImgLoaded(false);
            const [svgUrl, captchaid] = await getUrlAndId();
            setCaptchaData({ url: svgUrl, id: captchaid });
          }}
        >
          <IoReloadCircleSharp />
        </span>
      </p>
      <input
        placeholder={t`Enter Characters`}
        type="text"
        value={text}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoFocus
        style={{
          width: '6em',
          fontSize: 21,
          margin: 5,
        }}
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
            style={{ fontSize: 16 }}
          >
            {t`Cancel`}
          </button>
         &nbsp;
          <button
            type="submit"
            style={{ fontSize: 16 }}
          >
            {t`Send`}
          </button>
        </div>
      )}
    </form>
  );
};

export default React.memo(Captcha);
