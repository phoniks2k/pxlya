/*
 *
 */
import expressSession from 'express-session';
import RedisStore from '../utils/connectRedis';

import client from '../data/redis/client';
import { getHostFromRequest } from '../utils/ip';
import { HOUR, COOKIE_SESSION_NAME } from './constants';
import { SESSION_SECRET } from './config';


export const store = new RedisStore({ client });

/*
 * we cache created session middlewares per domain
 */
const middlewareCache = {};

export default (req, res, next) => {
  const domain = getHostFromRequest(req, false, true);
  console.log('THISHTISTHIST', domain);
  console.log(req.headers);
  let session = middlewareCache[domain];
  if (!session) {
    session = expressSession({
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
    middlewareCache[domain] = session;
  }
  return session(req, res, next);
};
