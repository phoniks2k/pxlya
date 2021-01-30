/*
 * Make basic reset_password forms
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import Html from './Html';

import { getTTag } from '../core/ttag';

export default function getPasswordResetHtml(name, code, lang, message = null) {
  const { t } = getTTag(lang);

  let body = '';

  if (message) {
    body = (
      <div>
        <h3>{t`Reset Password`}</h3>
        <p>{message}</p>
        <p><a href="./">{t`Click here`}</a>&nbsp;
          {t`to go back to pixelplanet`}</p>
      </div>
    );
  } else {
    body = (
      <form method="post" action="reset_password">
        <h3>{t`Reset Password`}</h3>
        <p>{t`Hello ${name}, you can set your new password here:`}</p>
        <input
          type="password"
          name="pass"
          placeholder={t`New Password`}
          style={{
            maxWidth: '35em',
          }}
        />
        <input
          type="password"
          name="passconf"
          placeholder={t`Confirm New Password`}
          style={{
            maxWidth: '35em',
          }}
        />
        <input type="hidden" name="code" value={code} />
        <button type="submit" name="submit">{t`Submit`}</button>
      </form>
    );
  }

  const title = t`PixelPlanet.fun Password Reset`;
  const description = t`Reset your password here`;

  const index = `<!doctype html>${
    ReactDOM.renderToStaticMarkup(<Html
      title={title}
      description={description}
      body={body}
    />)}`;
  return index;
}
