/*
 * Provide translation serverside
 * @flow
 */
import { TTag } from 'ttag';
import deLocale from '../../i18n/ssr-de.po';

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

export default ttags;
