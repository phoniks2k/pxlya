/*
 * Create canvases.json with localized translated
 * descriptions.
 *
 * @flow
 */

import canvases from './canvases.json';
import ttag from './core/ttag';

/* eslint-disable max-len */

function getCanvases(t) {
  /*
   * add descriptions and titles of canvases here
   * Use the t tab and right `backquotes`
   */
  const canvasTitles = {
    0: t`Earth`,
    1: t`Moon`,
    2: t`3D Canvas`,
    3: t`Coronavirus`,
    5: t`PixelZone`,
    6: t`PixelCanvas`,
    7: t`1bit`,
  };
  const canvasDesc = {
    0: t`Our main canvas, a huge map of the world. Place everywhere you like`,
    1: t`Moon canvas. Safe space for art. No flags or large text (unless part of art)`,
    2: t`Place Voxels on a 3D canvas with others`,
    3: t`Special canvas to spread awareness of SARS-CoV2`,
    5: t`Mirror of PixelZone`,
    6: t`Mirror of PixelCanvas`,
    7: t`Black and White canvas`,
  };
  /*
   * no edit below here needed when adding/removing canvas
   */

  const localicedCanvases = { ...canvases };
  const canvasKeys = Object.keys(localicedCanvases);

  for (let i = 0; i < canvasKeys.length; i += 1) {
    const key = canvasKeys[i];
    localicedCanvases[key].desc = canvasDesc[key] || `Canvas ${key}`;
    localicedCanvases[key].title = canvasTitles[key] || `Canvas ${key}`;
  }

  return localicedCanvases;
}


const lCanvases = {};
(() => {
  const langs = Object.keys(ttag);
  langs.forEach((lang) => {
    lCanvases[lang] = getCanvases(ttag[lang].t);
  });
})();

export function getLocalicedCanvases(lang) {
  return lCanvases[lang] || lCanvases.default;
}

export default lCanvases;
