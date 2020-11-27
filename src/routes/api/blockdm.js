/*
 *
 * block all private messages
 *
 * @flow
 */

import type { Request, Response } from 'express';

import logger from '../../core/logger';
import webSockets from '../../socket/websockets';

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

  /*
   * remove all dm channels
   */
  const channels = user.regUser.channel;
  for (let i = 0; i < channels.length; i += 1) {
    const channel = channels[i];
    if (channel.type === 1) {
      const channelId = channel.id;
      channel.destroy();
      const { dmu1id, dmu2id } = channel;
      webSockets.broadcastRemoveChatChannel(dmu1id, channelId, true);
      webSockets.broadcastRemoveChatChannel(dmu2id, channelId, true);
    }
  }

  res.json({
    status: 'ok',
  });
}

export default blockdm;
