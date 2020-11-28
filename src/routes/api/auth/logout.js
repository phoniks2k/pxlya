/*
 * logout
 * @flow
 */
import type { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not even logged in.'],
    });
    return;
  }

  req.logout();
  res.status(200);
  res.json({
    success: true,
  });
};
