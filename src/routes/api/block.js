/*
 *
 * blocks and unblocks a user
 *
 * @flow
 */

import type { Request, Response } from 'express';

import logger from '../../core/logger';
import { RegUser, UserBlock } from '../../data/models';

async function block(req: Request, res: Response) {
  let userId = parseInt(req.body.userId, 10);
  let { userName } = req.body;
  const { user } = req;

  const errors = [];
  const query = {};
  if (userId) {
    if (userId && Number.isNaN(userId)) {
      errors.push('Invalid userId');
    }
    query.id = userId;
  }
  if (userName) {
    query.name = userName;
  }
  if (!userName && !userId) {
    errors.push('No userId or userName defined');
  }
  if (!user || !user.regUser) {
    errors.push('You are not logged in');
  }
  if (user && userId && user.id === userId) {
    errors.push('You can not  DM yourself.');
  }
  if (errors.length) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const targetUser = await RegUser.findOne({
    where: query,
    attributes: [
      'id',
      'name',
    ],
    raw: true,
  });
  if (!targetUser) {
    res.status(401);
    res.json({
      errors: ['Target user does not exist'],
    });
    return;
  }
  userId = targetUser.id;
  userName = targetUser.name;

  const ret = await UserBlock.findOrCreate({
    where: {
      uid: user.id,
      buid: userId,
    },
    raw: true,
    attributes: ['uid'],
  });
  if (ret) {
    res.json({
      status: 'ok',
    });
  } else {
    res.status(502);
    res.json({
      errors: ['Could not block user'],
    });
    logger.info(
      `User ${user.getName()} blocked ${userName}`,
    );
  }
}

export default block;
