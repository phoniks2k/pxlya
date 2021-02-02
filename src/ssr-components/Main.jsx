/*
 * Html for mainpage
 *
 * @flow
 */


import React from 'react';
import ReactDOM from 'react-dom/server';

import { langCodeToCC } from '../utils/location';
import ttags, { getTTag } from '../core/ttag';
import Html from './Html';
/* this one is set by webpack */
// eslint-disable-next-line import/no-unresolved
import assets from './assets.json';
// eslint-disable-next-line import/no-unresolved
import styleassets from './styleassets.json';

import { ASSET_SERVER, BACKUP_URL } from '../core/config';

/*
 * generate language list
 */
const langs = Object.keys(ttags)
  .map((l) => (l === 'default' ? 'en' : l))
  .map((l) => [l, langCodeToCC(l)]);

/*
 * values that we pass to client scripts
 */
const ssv = {
  assetserver: ASSET_SERVER,
  availableStyles: styleassets,
  langs,
};
if (BACKUP_URL) {
  ssv.backupurl = BACKUP_URL;
}

const defaultScripts = assets.client.js.map(
  (s) => ASSET_SERVER + s,
);
const css = [
  {
    id: 'globcss',
    uri: styleassets.default,
  },
];

/*
 * Generates string with html of main page
 * @param countryCoords Cell with coordinates of client country
 * @param lang language code
 * @return html of mainpage
 */
function generateMainPage(countryCoords: Cell, lang: string): string {
  const [x, y] = countryCoords;
  const ssvR = {
    ...ssv,
    coordx: x,
    coordy: y,
    lang: lang === 'default' ? 'en' : lang,
  };
  const scripts = (assets[`client-${lang}`])
    ? assets[`client-${lang}`].js.map((s) => ASSET_SERVER + s)
    : defaultScripts;
  const { t } = getTTag(lang);
  // eslint-disable-next-line
  const html = ReactDOM.renderToStaticMarkup(
    <Html
      title={t`PixelPlanet.fun`}
      // eslint-disable-next-line max-len
      description={t`Place color pixels on an map styled canvas with other players online`}
      scripts={scripts}
      css={css}
      // eslint-disable-next-line max-len
      code={`window.ssv=JSON.parse('${JSON.stringify(ssvR)}');`}
      useCaptcha
    />,
  );

  return `<!doctype html>${html}`;
}

export default generateMainPage;
