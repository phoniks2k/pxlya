/*
 *
 */
import expressSession from 'express-session';
import RedisStore from '../utils/connectRedis';

import redis from '../data/redis';
import { HOUR, COOKIE_SESSION_NAME } from './constants';
import { SESSION_SECRET } from './config';


export const store = new RedisStore({ client: redis });

const session = expressSession({
  name: COOKIE_SESSION_NAME,
  store,
  secret: SESSION_SECRET,
  // The best way to know is to check with your store if it implements the touch method. If it does, then you can safely set resave: false
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    // not setting maxAge or expire makes it a non-persisting cookies
    maxAge: 30 * 24 * HOUR,
  },
});

export default session;
