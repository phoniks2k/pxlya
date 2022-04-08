/* @flow */

import { createClient } from 'redis';

import { REDIS_URL } from '../core/config';

const redis = createClient(REDIS_URL.startsWith('redis://')
  ? {
    url: REDIS_URL,
    // needed for connect-redis
    legacyMode: true,
  }
  : {
    socket: {
      path: REDIS_URL,
    },
    // needed for connect-redis
    legacyMode: true,
  },
);

export const redisV3 = redis;

export const connect = async () => {
  // eslint-disable-next-line no-console
  console.log(`Connecting to redis server at ${REDIS_URL}`);
  await redis.connect();
};

/*
 * multi is not in .v4 in legacyMode,
 * might be fixed in the future
 * https://github.com/redis/node-redis/blob/329885b4ae3167d0092e856095b726e2adf89c97/packages/client/lib/client/multi-command.ts
 */
redis.v4.multi = () => redis.multi().v4;

export default redis.v4;
