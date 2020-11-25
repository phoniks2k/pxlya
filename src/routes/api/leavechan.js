/*
 *
 * starts a DM session
 *
 * @flow
 */

import type { Request, Response } from 'express';

import logger from '../../core/logger';

async function leaveChan(req: Request, res: Response) {
  const channelId = parseInt(req.body.channelId, 10);
  const { user } = req;

  const errors = [];
  if (channelId && Number.isNaN(channelId)) {
    errors.push('Invalid channelId');
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

  const userChannels = user.regUser.channel;
  let channel = null;
  for (let i = 0; i < userChannels.length; i += 1) {
    if (userChannels[i].id === channelId) {
      channel = userChannels[i];
      break;
    }
  }
  if (!channel) {
    res.status(401);
    res.json({
      errors: ['You are not in this channel'],
    });
    return;
  }

  /*
   * Just supporting DMs by now, because
   * Channels do not get deleted when all Users left.
   * Group Channels need this.
   * Faction and Default channels should be impossible to leave
   */
  if (channel.type !== 1) {
    res.status(401);
    res.json({
      errors: ['Can not leave this channel'],
    });
    return;
  }

  logger.info(
    `Removing user ${user.getName()} from channel ${channel.name || channelId}`,
  );
  user.regUser.removeChannel(channel);

  // TODO: inform websocket to remove channelId from user
  res.json({
    status: 'ok',
  });
}

export default leaveChan;
