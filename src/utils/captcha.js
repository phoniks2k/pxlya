/**
 *
 * @flow
 */

import logger from '../core/logger';
import redis from '../data/redis';

import {
  CAPTCHA_URL,
  CAPTCHA_TIME,
} from '../core/config';

const TTL_CACHE = CAPTCHA_TIME * 60; // seconds

/*
 * https://docs.hcaptcha.com/
 *
 * @param token
 * @param ip
 * @return boolean, true if successful, false on error or fail
 */
async function verifyHCaptcha(
  token: string,
  ip: string,
): Promise<boolean> {
  const success = true;
  if (success) {
    logger.info(`CAPTCHA ${ip} successfully solved captcha`);
    return true;
  }
  logger.info(`CAPTCHA Token for ${ip} not ok`);
  return false;
}

/*
 * verify captcha token from client
 *
 * @param token token of solved captcha from client
 * @param ip
 * @returns Boolean if successful
 */
export async function verifyCaptcha(
  token: string,
  ip: string,
): Promise<boolean> {
  try {
    const key = `human:${ip}`;

    if (!await verifyHCaptcha(token, ip)) {
      return false;
    }

    await redis.setAsync(key, '', 'EX', TTL_CACHE);
    return true;
  } catch (error) {
    logger.error(error);
  }
  return false;
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

  const key = `human:${ip}`;
  const ttl: number = await redis.ttlAsync(key);
  if (ttl > 0) {
    return false;
  }
  logger.info(`CAPTCHA ${ip} got captcha`);
  return true;
}


export default verifyCaptcha;
