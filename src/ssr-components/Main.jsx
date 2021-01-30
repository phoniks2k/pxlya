/*
 * Html for mainpage
 *
 * @flow
 */


import React from 'react';
import ReactDOM from 'react-dom/server';

import { getTTag } from '../core/ttag';
import Html from './Html';
/* this one is set by webpack */
// eslint-disable-next-line import/no-unresolved
import assets from './assets.json';
// eslint-disable-next-line import/no-unresolved
import styleassets from './styleassets.json';

import { ASSET_SERVER, BACKUP_URL } from '../core/config';

// eslint-disable-next-line max-len
let code = `window.assetserver="${ASSET_SERVER}";window.availableStyles=JSON.parse('${JSON.stringify(styleassets)}');`;
if (BACKUP_URL) {
  code += `window.backupurl="${BACKUP_URL}";`;
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
 * generates string with html of main page
 * including setting global variables for countryCoords
 * and assetserver
 * @param countryCoords Cell with coordinates of client country
 * @param lang language code
 * @return html of mainpage
 */
function generateMainPage(countryCoords: Cell, lang: string): string {
  const [x, y] = countryCoords;
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
      code={`${code}window.coordx=${x};window.coordy=${y};`}
      useCaptcha
    />,
  );

  return `<!doctype html>${html}`;
}

export default generateMainPage;
