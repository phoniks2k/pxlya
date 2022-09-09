/*
 * redis client
 * REDIS_URL can be url or path to unix socket
 */
import fs from 'fs';
import { createClient, defineScript } from 'redis';
import { isMainThread } from 'worker_threads';

import { REDIS_URL, SHARD_NAME } from '../../core/config';

const scripts = {
  placePxl: defineScript({
    NUMBER_OF_KEYS: 5,
    SCRIPT: fs.readFileSync('./workers/lua/placePixel.lua'),
    transformArguments(...args) {
      return args.map((a) => ((typeof a === 'string') ? a : a.toString()));
    },
  }),
};

const client = createClient(REDIS_URL.startsWith('redis://')
  ? {
    url: REDIS_URL,
    scripts,
  }
  : {
    socket: {
      path: REDIS_URL,
    },
    scripts,
  },
);

/*
 * for sending messages via cluster
 */
export const pubsub = {
  subscriber: null,
  publisher: null,
};

export const connect = async () => {
  // eslint-disable-next-line no-console
  console.log(`Connecting to redis server at ${REDIS_URL}`);
  await client.connect();
  if (SHARD_NAME && isMainThread) {
    const subscriber = client.duplicate();
    await subscriber.connect();
    pubsub.publisher = client;
    pubsub.subscriber = subscriber;
  }
};

export default client;
