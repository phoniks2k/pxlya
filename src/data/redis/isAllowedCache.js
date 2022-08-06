/*
 * cache allowed ips
 * used for proxychecker and banlist
 */

import client from './client';

const PREFIX = 'isal:';
const CACHE_DURATION = 14 * 24 * 3600;

export function cacheAllowed(ip, allowed) {
  const key = `${PREFIX}:${ip}`;
  return client.set(key, allowed.status, {
    EX: CACHE_DURATION,
  });
}

export async function getCacheAllowed(ip) {
  const key = `${PREFIX}:${ip}`;
  let cache = await client.get(key);
  if (!cache) {
    return null;
  }
  cache = parseInt(cache, 10);
  return {
    allowed: (cache <= 0),
    status: cache,
  };
}

export function cleanCacheForIP(ip) {
  const key = `${PREFIX}:${ip}`;
  return client.del(key);
}
