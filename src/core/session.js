/*
 *
 */
import session from 'express-session';
import RedisStore from '../utils/connectRedis';

import client from '../data/redis/client';
import { getHostFromRequest } from '../utils/ip';
import { HOUR, COOKIE_SESSION_NAME } from './constants';
import { SESSION_SECRET } from './config';


export const store = new RedisStore({ client });

export default (req, res, next) => {
  const domain = getHostFromRequest(req, false, true);
  const sess = session({
    name: COOKIE_SESSION_NAME,
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain,
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * HOUR,
    },
  });
  return sess(req, res, next);
};
