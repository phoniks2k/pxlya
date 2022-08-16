/*
 * create html for Window page
 *
 */

/* eslint-disable max-len */

import { getTTag } from '../core/ttag';

/* this will be set by webpack */
import { assets } from '../core/assets';
import { ASSET_SERVER } from '../core/config';

/*
 * generates string with html of globe page
 * @param lang language code
 * @return html of mainpage
 */
function generateWinPage(lang) {
  const script = (assets[`win-${lang}`])
    ? assets[`win-${lang}`].js
    : assets.win.js;

  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`PixelPlanet.Fun Window`}</title>
        <meta name="description" content="${t`PixelPlanet.Fun Windows`}" />
        <meta name="google" content="nopagereadaloud" />
        <meta name="theme-color" content="#cae3ff" />
        <meta name="viewport"
          content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
      </head>
      <body>
        <script src="${ASSET_SERVER + script}"></script>
      </body>
    </html>
  `;

  return html;
}

export default generateWinPage;
