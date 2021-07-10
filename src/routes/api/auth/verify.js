/*
 * verify mail address
 * @flow
 */

import type { Request, Response } from 'express';

import socketEvents from '../../../socket/SocketEvents';
import getHtml from '../../../ssr-components/RedirectionPage';
import { getHostFromRequest } from '../../../utils/ip';
import mailProvider from '../../../core/mail';

export default async (req: Request, res: Response) => {
  const { token } = req.query;
  const { lang } = req;
  const { t } = req.ttag;
  const name = await mailProvider.verify(token);
  const host = getHostFromRequest(req);
  if (name) {
    // notify websoecket to reconnect user
    // thats a bit counter productive because it directly links to the websocket
    socketEvents.reloadUser(name);
    // ---
    const index = getHtml(
      t`Mail verification`,
      t`You are now verified :)`,
      host, lang,
    );
    res.status(200).send(index);
  } else {
    // eslint-disable-next-line max-len
    const index = getHtml(t`Mail verification`, t`Your mail verification code is invalid or already expired :(, please request a new one.`, host, lang);
    res.status(400).send(index);
  }
};
