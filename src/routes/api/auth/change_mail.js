/*
 * request password change
 */

import mailProvider from '../../../core/mail';

import { validatePassword, validateEMail } from '../../../utils/validation';
import { getHostFromRequest } from '../../../utils/ip';
import { compareToHash } from '../../../utils/hash';

function validate(email, password, gettext) {
  const errors = [];

  const passerror = gettext(validatePassword(password));
  if (passerror) errors.push(passerror);
  const mailerror = gettext(validateEMail(email));
  if (mailerror) errors.push(mailerror);

  return errors;
}

export default async (req, res) => {
  const { email, password } = req.body;
  const { t, gettext } = req.ttag;
  const errors = validate(email, password, gettext);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const { user, lang } = req;
  if (!user || !user.regUser) {
    res.status(401);
    res.json({
      errors: [t`You are not authenticated.`],
    });
    return;
  }

  const currentPassword = user.regUser.password;
  if (!compareToHash(password, currentPassword)) {
    res.status(400);
    res.json({
      errors: [t`Incorrect password!`],
    });
    return;
  }

  await user.regUser.update({
    email,
    mailVerified: false,
  });

  const host = getHostFromRequest(req);
  mailProvider.sendVerifyMail(email, user.regUser.name, host, lang);

  res.json({
    success: true,
  });
};
