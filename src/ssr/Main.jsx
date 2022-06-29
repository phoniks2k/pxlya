/*
 * Html for mainpage
 */

/* eslint-disable max-len */


import { langCodeToCC } from '../utils/location';
import ttags, { getTTag } from '../core/ttag';
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

/*
 * Generates string with html of main page
 * @param countryCoords Cell with coordinates of client country
 * @param lang language code
 * @return html of mainpage
 */
function generateMainPage(lang) {
  const ssvR = {
    ...ssv,
    lang: lang === 'default' ? 'en' : lang,
  };
  const scripts = (assets[`client-${lang}`])
    ? assets[`client-${lang}`].js
    : assets.client.js;
  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`PixelPlanet.Fun`}</title>
        <meta name="description" content="${t`Place color pixels on an map styled canvas with other players online`}" />
        <meta name="google" content="nopagereadaloud" />
        <meta name="theme-color" content="#cae3ff" />
        <meta name="viewport"
          content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <script>window.ssv=JSON.parse('${JSON.stringify(ssvR)}')</script>
        <link rel="stylesheet" type="text/css" id="globcss" href="${styleassets.default}" />
      </head>
      <body>
        <div id="app">
        </div>
        ${scripts.map((script) => `<script src="${ASSET_SERVER + script}"></script>`).join('')}
      </body>
    </html>
  `;
  return html;
}

export default generateMainPage;
