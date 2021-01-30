/*
 * react html for 3D globe page
 *
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';

import { getTTag } from '../core/ttag';

import Html from './Html';
/* this will be set by webpack */
// eslint-disable-next-line import/no-unresolved
import assets from './assets.json';
import { ASSET_SERVER } from '../core/config';

import globeCss from '../styles/globe.css';

const styles = [{
  id: 'globe',
  cssText: globeCss,
}];

const defaultScripts = assets.globe.js.map(
  (s) => ASSET_SERVER + s,
);

/*
 * generates string with html of globe page
 * @param lang language code
 * @return html of mainpage
 */
function generateGlobePage(lang: string): string {
  const scripts = (assets[`globe-${lang}`])
    ? assets[`globe-${lang}`].js.map((s) => ASSET_SERVER + s)
    : defaultScripts;

  const { t } = getTTag(lang);
  const Globe = () => (
    <div>
      <div id="webgl" />
      <div id="coorbox">(0, 0)</div>
      <div id="info">{t`Double click on globe to go back.`}</div>
      <div id="loading">{t`Loading...`}</div>
    </div>
  );

  const html = ReactDOM.renderToStaticMarkup(
    <Html
      title={t`PixelPlanet.Fun 3DGlobe`}
      description={t`A 3D globe of our whole map`}
      scripts={scripts}
      body={<Globe />}
      styles={styles}
    />,
  );

  return `<!doctype html>${html}`;
}

export default generateGlobePage;
