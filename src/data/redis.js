/*
 * redis client
 * REDIS_URL can be url or path to unix socket
 */

import { createClient } from 'redis';

import { REDIS_URL } from '../core/config';

const redis = createClient(REDIS_URL.startsWith('redis://')
  ? {
    url: REDIS_URL,
  }
  : {
    socket: {
      path: REDIS_URL,
    },
  },
);

export const connect = async () => {
  // eslint-disable-next-line no-console
  console.log(`Connecting to redis server at ${REDIS_URL}`);
  await redis.connect();
};

export default redis;
