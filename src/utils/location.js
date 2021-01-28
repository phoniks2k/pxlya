/*
 * @flow
 */

import ccCoords from '../data/countrycode-coords-array.json';


/*
 * takes country name in two letter ISO style,
 * return canvas coords based on pre-made json list
 * @param cc Two letter country code
 * @return coords X/Y coordinates of the country on the canvas
 */
export function ccToCoords(cc: string) {
  if (!cc) {
    return [0, 0];
  }
  const country = cc.toLowerCase();
  const coords = ccCoords[country];
  return (coords) || [0, 0];
}

/*
 * gets prefered language out of localisation string
 * @param location string (like from accept-language header)
 * @return language code
 */
export function languageFromLocalisation(localisation) {
  let lang = localisation;
  let i = lang.indexOf('-');
  if (i !== -1) {
    lang = lang.slice(0, i);
  }
  i = lang.indexOf(',');
  if (i !== -1) {
    lang = lang.slice(0, i);
  }
  i = lang.indexOf(';');
  if (i !== -1) {
    lang = lang.slice(0, i);
  }
  return lang;
}

export default ccToCoords;
