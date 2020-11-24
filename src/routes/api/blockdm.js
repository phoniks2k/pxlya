/*
 *
 * block all private messages
 *
 * @flow
 */

import type { Request, Response } from 'express';

import logger from '../../core/logger';

async function blockdm(req: Request, res: Response) {
  const { block } = req.body;
  const { user } = req;

  const errors = [];
  if (typeof block !== 'boolean') {
    errors.push('Not defined if blocking or unblocking');
  }
  if (!user || !user.regUser) {
    errors.push('You are not logged in');
  }
  if (errors.length) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  logger.info(
    `User ${user.getName()} (un)blocked all dms`,
  );

  await user.regUser.update({
    blockDm: block,
  });

  // TODO notify websocket

  res.json({
    status: 'ok',
  });
}

export default blockdm;
