/**
 *
 * @flow
 */

import logger from '../core/logger';
import redis from '../data/redis';
import { getIPv6Subnet } from './ip';
import {
  CAPTCHA_URL,
  CAPTCHA_TIME,
  CAPTCHA_TIMEOUT,
} from '../core/config';

const TTL_CACHE = CAPTCHA_TIME * 60; // seconds

function captchaTextFilter(text: string) {
  let ret = text.toString('utf8');
  ret = ret.split('l').join('i');
  ret = ret.split('0').join('O');
  ret = ret.toLowerCase();
  return ret;
}

/*
 * set captcha solution
 *
 * @param text Solution of captcha
 * @param ip
 * @param ttl time to be valid in seconds
 */
export function setCaptchaSolution(
  text: string,
  ip: string,
) {
  const key = `capt:${ip}`;
  return redis.setAsync(key, captchaTextFilter(text), 'EX', CAPTCHA_TIMEOUT);
}

/*
 * check captcha solution
 *
 * @param text Solution of captcha
 * @param ip
 * @return 0 if solution right
 *         1 if timed out
 *         2 if wrong
 */
export async function checkCaptchaSolution(
  text: string,
  ip: string,
) {
  const ipn = getIPv6Subnet(ip);
  const key = `capt:${ip}`;
  const solution = await redis.getAsync(key);
  if (solution) {
    if (solution.toString('utf8') === captchaTextFilter(text)) {
      const solvkey = `human:${ipn}`;
      await redis.setAsync(solvkey, '', 'EX', TTL_CACHE);
      logger.info(`CAPTCHA ${ip} successfully solved captcha`);
      return 0;
    }
    logger.info(
      `CAPTCHA ${ip} got captcha wrong (${text} instead of ${solution})`,
    );
    return 2;
  }
  logger.info(`CAPTCHA ${ip} timed out`);
  return 1;
}

/*
 * check if captcha is needed
 *
 * @param ip
 * @return boolean true if needed
 */
export async function needCaptcha(ip: string) {
  if (!CAPTCHA_URL) {
    return false;
  }

  const key = `human:${getIPv6Subnet(ip)}`;
  const ttl: number = await redis.ttlAsync(key);
  if (ttl > 0) {
    return false;
  }
  logger.info(`CAPTCHA ${ip} got captcha`);
  return true;
}
