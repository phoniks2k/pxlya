/**
 *
 * @flow
 */


import type { Request, Response } from 'express';
import Sequelize from 'sequelize';

import logger from '../../../core/logger';
import { RegUser } from '../../../data/models';
import mailProvider from '../../../core/mail';
import getMe from '../../../core/me';
import { getIPFromRequest, getHostFromRequest } from '../../../utils/ip';
import {
  validateEMail,
  validateName,
  validatePassword,
} from '../../../utils/validation';

async function validate(email, name, password, t, gettext) {
  const errors = [];
  const emailerror = gettext(validateEMail(email));
  if (emailerror) errors.push(emailerror);
  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);
  const passworderror = gettext(validatePassword(password));
  if (passworderror) errors.push(passworderror);

  let reguser = await RegUser.findOne({ where: { email } });
  if (reguser) errors.push(t`E-Mail already in use.`);
  reguser = await RegUser.findOne({ where: { name } });
  if (reguser) errors.push(t`Username already in use.`);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  const { t, gettext } = req.ttag;
  const errors = await validate(email, name, password, t, gettext);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const newuser = await RegUser.create({
    email,
    name,
    password,
    verificationReqAt: Sequelize.literal('CURRENT_TIMESTAMP'),
    lastLogIn: Sequelize.literal('CURRENT_TIMESTAMP'),
  });

  if (!newuser) {
    res.status(500);
    res.json({
      errors: [t`Failed to create new user :(`],
    });
    return;
  }

  const ip = getIPFromRequest(req);
  logger.info(`Created new user ${name} ${email} ${ip}`);

  const { user, lang } = req;
  user.setRegUser(newuser);
  const me = await getMe(user, lang);

  await req.logIn(user, (err) => {
    if (err) {
      res.status(500);
      res.json({
        errors: [t`Failed to establish session after register :(`],
      });
      return;
    }
    const host = getHostFromRequest(req);
    mailProvider.sendVerifyMail(email, name, host, lang);
    res.status(200);
    res.json({
      success: true,
      me,
    });
  });
};
