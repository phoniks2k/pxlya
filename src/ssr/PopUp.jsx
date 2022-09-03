/*
 * create html for popup page
 *
 */

/* eslint-disable max-len */

import { langCodeToCC } from '../utils/location';
import ttags, { getTTag } from '../core/ttag';

/* this will be set by webpack */
import { styleassets, assets } from '../core/assets';
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
 * generates string with html of win page
 * @param lang language code
 * @return html of mainpage
 */
function generatePopUpPage(lang) {
  const ssvR = {
    ...ssv,
    lang: lang === 'default' ? 'en' : lang,
  };
  const script = (assets[`popup-${lang}`])
    ? assets[`popup-${lang}`].js
    : assets.popup.js;

  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`PixelPlanet.Fun PopUp`}</title>
        <meta name="description" content="${t`PixelPlanet.Fun PopUp`}" />
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
        <script src="${ASSET_SERVER + script}"></script>
      </body>
    </html>
  `;

  return html;
}

export default generatePopUpPage;
