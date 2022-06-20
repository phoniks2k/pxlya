/*
 * logout
 * @flow
 */
import type { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const { user } = req;
  const { t } = req.ttag;
  if (!user) {
    res.status(401);
    res.json({
      errors: [t`You are not even logged in.`],
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
    res.status(200);
    res.json({
      success: true,
    });
  });
};
