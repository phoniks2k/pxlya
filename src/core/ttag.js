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
  const langs = localeImports.keys();
  for (let i = 0; i < langs.length; i += 1) {
    const file = langs[i];
    const ttag = new TTag();
    // ./ssr-de.po
    const lang = file.replace('./ssr-', '').replace('.po', '');
    ttag.addLocale(lang, localeImports(file).default);
    ttag.useLocale(lang);
    ttags[lang] = ttag;
  }
})();

export function getTTag(lang) {
  return ttags[lang] || ttags.default;
}

export function expressTTag(req, res, next) {
  const language = req.headers['accept-language'];
  req.lang = (language) ? languageFromLocalisation(language) : 'default';
  req.ttag = getTTag(req.lang);
  next();
}

export default ttags;
