/* @flow */

import bluebird from 'bluebird';
import redis from 'redis';

import { REDIS_URL } from '../core/config';

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient(REDIS_URL, { return_buffers: true });

export default client;
