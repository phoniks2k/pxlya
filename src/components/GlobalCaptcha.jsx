/*
 * Global Captcha that is valid sitewide
 * via api/captcha
 * Displayed in an Alert
 */

import React, { useState } from 'react';
import { t } from 'ttag';

import Captcha from './Captcha';
import { requestSolveCaptcha } from '../actions/fetch';

const GlobalCaptcha = ({ close }) => {
  const [errors, setErrors] = useState([]);
  // used to be able to force Captcha rerender on error
  const [captKey, setCaptKey] = useState(Date.now());

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const text = e.target.captcha.value;
        const captchaid = e.target.captchaid.value;
        const { errors: resErrors } = await requestSolveCaptcha(
          text,
          captchaid,
        );
        if (resErrors) {
          setCaptKey(Date.now());
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
      <Captcha autoload key={captKey} />
      <p>
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
      </p>
    </form>
  );
};

export default React.memo(GlobalCaptcha);
