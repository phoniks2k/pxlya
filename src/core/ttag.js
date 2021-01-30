/*
 * Provide translation serverside
 * @flow
 */
import { TTag } from 'ttag';
import { languageFromLocalisation } from '../utils/location';

// eslint-disable-next-line max-len
const localeImports = require.context('../../i18n', false, /^\.[/\\]ssr-.+\.po$/);

const ttags = {
  default: new TTag(),
};

(() => {
  localeImports.keys().forEach((file) => {
    const ttag = new TTag();
    // ./ssr-de.po
    const lang = file.replace('./ssr-', '').replace('.po', '');
    ttag.addLocale(lang, localeImports(file).default);
    ttag.useLocale(lang);
    ttags[lang] = ttag;
  });
})();

export function getTTag(lang) {
  return ttags[lang] || ttags.default;
}

export function expressTTag(req, res, next) {
  const language = req.headers['accept-language'];
  req.lang = (language) ? languageFromLocalisation(language) : 'en';
  req.ttag = getTTag(req.lang);
  next();
}

export default ttags;
