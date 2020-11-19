/*
 *
 * starts a DM session
 *
 * @flow
 */

import type { Request, Response } from 'express';

import logger from '../../core/logger';
import { Channel, UserChannel, RegUser } from '../../data/models';
import { isUserBlockedBy } from '../../data/models/UserBlock';

async function startDm(req: Request, res: Response) {
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

  /*
   * check if blocked
   */
  if (await isUserBlockedBy(user.id, userId)) {
    res.status(401);
    res.json({
      errors: ['You are blocked by this user'],
    });
    return;
  }

  logger.info(
    `Creating DM Channel between ${user.regUser.name} and ${userName}`,
  );
  /*
   * start DM session
   */
  let dmu1id = null;
  let dmu2id = null;
  if (user.id > userId) {
    dmu1id = userId;
    dmu2id = user.id;
  } else {
    dmu1id = user.id;
    dmu2id = userId;
  }

  const channel = await Channel.findOrCreate({
    where: {
      type: 1,
      dmu1id,
      dmu2id,
    },
    raw: true,
  });
  const ChannelId = channel[0].id;
  const { lastMessage } = channel[0];

  const promises = [
    UserChannel.findOrCreate({
      where: {
        UserId: dmu1id,
        ChannelId,
      },
      raw: true,
    }),
    UserChannel.findOrCreate({
      where: {
        UserId: dmu2id,
        ChannelId,
      },
      raw: true,
    }),
  ];
  await Promise.all(promises);

  // TODO: inform websocket to add channelId to user
  res.json({
    channel: [
      ChannelId,
      userName,
      1,
      lastMessage,
    ],
  });
}

export default startDm;
