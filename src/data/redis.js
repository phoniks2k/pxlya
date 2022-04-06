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

export default redis.v4;
