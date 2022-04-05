/* @flow */

import { createClient } from 'redis';

import { REDIS_URL } from '../core/config';

const redis = createClient({
  path: REDIS_URL,
  // needed for connect-redis
  legacyMode: true,
});

export const redisV3 = redis;

export default redis.v4;
