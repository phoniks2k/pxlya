/*
 * Make basic redirection page
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import Html from './Html';

import { getTTag } from '../core/ttag';

function getHtml(description, text, host, lang) {
  const { jt, t } = getTTag(lang);

  const clickHere = <a href={host}>{t`Click here`}</a>;

  const body = (
    <div>
      <h3>{text}</h3>
      <p>{t`You will be automatically redirected after 15s`}</p>
      <p>{jt`Or ${clickHere} to go back to pixelplanet`}</p>
    </div>
  );

  const title = t`PixelPlanet.fun Accounts`;
  // eslint-disable-next-line max-len
  const code = `window.setTimeout(function(){window.location.href="${host}";},15000)`;

  const index = `<!doctype html>${
    ReactDOM.renderToStaticMarkup(
      <Html title={title} description={description} body={body} code={code} />,
    )
  }`;
  return index;
}

export default getHtml;
