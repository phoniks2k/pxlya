/*
 * provide location and lang specific features
 */

import ccCoords from '../data/countrycode-coords-array.json';


/*
 * takes country name in two letter ISO style,
 * return canvas coords based on pre-made json list
 * @param cc Two letter country code
 * @return coords X/Y coordinates of the country on the canvas
 */
export function ccToCoords(cc) {
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
  if (!localisation) {
    return 'default';
  }
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
  if (lang === 'en') {
    lang = 'default';
  }
  return lang.toLowerCase();
}

/*
 * get country code to language code for displaying flags
 * to languages
 * @param lang 2-char lang code
 * @return 2-char country code
 */
const lang2CC = {
  en: 'gb',
  dz: 'bt',
  hy: 'am',
  uk: 'ua',
  ca: 'ct',
};
export function langCodeToCC(lang) {
  return lang2CC[lang] || lang;
}

export default ccToCoords;
