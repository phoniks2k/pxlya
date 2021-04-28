/*
 * request password change
 * @flow
 */


import type { Request, Response } from 'express';

import webSockets from '../../../socket/websockets';
import { RegUser } from '../../../data/models';
import { validateName } from '../../../utils/validation';

async function validate(oldname, name) {
  if (oldname === name) return 'You already have that name.';

  const nameerror = validateName(name);
  if (nameerror) return nameerror;

  const reguser = await RegUser.findOne({ where: { name } });
  if (reguser) return 'Username already in use.';

  return null;
}

export default async (req: Request, res: Response) => {
  const { name } = req.body;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const oldname = user.regUser.name;
  const error = await validate(oldname, name);
  if (error) {
    res.status(400);
    res.json({
      errors: [error],
    });
    return;
  }

  await user.regUser.update({ name });

  webSockets.reloadUser(oldname);

  res.json({
    success: true,
  });
};
