/*
 * Functions for validation of user input
 * This gets used on server and on the client.
 *
 * On the server the return values will be again translated with gettext
 * which could be a bit questionable, but it is preferable to write this file
 * two times imho.
 *
 * @flow
 */

import { t } from 'ttag';

// eslint-disable-next-line no-useless-escape, max-len
const mailTester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

export function validateEMail(email) {
  if (!email) return t`Email can't be empty.`;
  if (email.length < 5) return t`Email should be at least 5 characters long.`;
  if (email.length > 40) return t`Email can't be longer than 40 characters.`;
  if (email.indexOf('.') === -1) return t`Email should at least contain a dot`;
  if (email.split('').filter((x) => x === '@').length !== 1) {
    return t`Email should contain a @`;
  }
  if (!mailTester.test(email)) return 'Your Email looks shady';
  return false;
}

export function validateName(name) {
  if (!name) return t`Name can't be empty.`;
  if (name.length < 4) return t`Name must be at least 4 characters long`;
  if (name.length > 26) return t`Name must be shorter than 26 characters`;
  if (name.indexOf('@') !== -1
      || name.indexOf('/') !== -1
      || name.indexOf('\\') !== -1
      || name.indexOf('>') !== -1
      || name.indexOf('<') !== -1
      || name.indexOf('#') !== -1) {
    return t`Name contains invalid character like @, /, \\ or #`;
  }
  return false;
}

export function sanitizeName(name) {
  name = name.substring(0, 25);
  // just sanitizes @ for now, other characters do not seem
  // problematic, even thought that we rule them out in validateName
  name = name.replace(/@/g, 'at');
  return name;
}

export function validatePassword(password) {
  if (!password) {
    return t`No password given.`;
  }
  if (password.length < 6) {
    return t`Password must be at least 6 characters long.`;
  }
  if (password.length > 60) {
    return t`Password must be shorter than 60 characters.`;
  }
  return false;
}
