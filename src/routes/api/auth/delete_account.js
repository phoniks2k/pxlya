/*
 * request password change
 */

import { RegUser } from '../../../data/sql';
import { validatePassword } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';

function validate(password, gettext) {
  const errors = [];

  const passworderror = gettext(validatePassword(password));
  if (passworderror) errors.push(passworderror);

  return errors;
}

export default async (req, res) => {
  const { password } = req.body;
  const { t, gettext } = req.ttag;
  const errors = await validate(password, gettext);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: [t`You are not authenticated.`],
    });
    return;
  }
  const { id } = user;

  const currentPassword = user.regUser.password;
  if (!currentPassword || !compareToHash(password, currentPassword)) {
    res.status(400);
    res.json({
      errors: [t`Incorrect password!`],
    });
    return;
  }


  req.logout((err) => {
    if (err) {
      res.status(500);
      res.json({
        errors: [t`Server error when logging out.`],
      });
      return;
    }

    RegUser.destroy({ where: { id } });

    res.status(200);
    res.json({
      success: true,
    });
  });
};
