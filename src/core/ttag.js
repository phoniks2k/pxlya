/*
 * Provide translation serverside
 * @flow
 */
import { TTag } from 'ttag';
import deLocale from '../../i18n/ssr-de.po';
import { languageFromLocalisation } from '../utils/location';

const LOCALES = {
  de: deLocale,
};

const ttags = {
  default: new TTag(),
};

(() => {
  const langs = Object.keys(LOCALES);
  langs.forEach((lang) => {
    const ttag = new TTag();
    ttag.addLocale(lang, LOCALES[lang]);
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
