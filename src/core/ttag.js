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

function populateTTags() {
  const langs = Object.keys(LOCALES);
  langs.forEach((lang) => {
    const ttag = new TTag();
    ttag.addLocale(lang, LOCALES[lang]);
    ttag.useLocale(lang);
    ttags[lang] = ttag;
  });
}
populateTTags();

export function getTTag(lang) {
  if (ttags[lang]) {
    return ttags[lang];
  }
  return ttags.default;
}

export default ttags.default;
