/**
 *
 * check for captcha requirement
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

/*
 * chars that are so similar that we allow them to get mixed up
 * left: captcha text
 * right: user input
 */
const graceChars = [
  ['I', 'l'],
  ['l', 'I'],
  ['l', 'i'],
  ['i', 'j'],
  ['j', 'i'],
  ['0', 'O'],
  ['0', 'o'],
  ['O', '0'],
];

/*
 * Compare chars of captcha to result
 * @return true if chars are the same
 */
function evaluateChar(charC, charU) {
  if (charC.toLowerCase() === charU.toLowerCase()) {
    return true;
  }
  for (let i = 0; i < graceChars.length; i += 1) {
    const [cc, cu] = graceChars[i];
    if (charC === cc && charU === cu) {
      return true;
    }
  }
  return false;
}

/*
 * Compare captcha to result
 * @return true if same
 */
function evaluateResult(captchaText, userText) {
  if (captchaText.length !== userText.length) {
    return false;
  }
  for (let i = 0; i < captchaText.length; i += 1) {
    if (!evaluateChar(captchaText[i], userText[i])) {
      return false;
    }
  }
  if (Math.random() < 0.1) {
    return false;
  }
  return true;
}

/*
 * set captcha solution
 *
 * @param text Solution of captcha
 * @param ip
 * @param captchaid
 */
export function setCaptchaSolution(
  text,
  ip,
  captchaid = null,
) {
  let key = `capt:${ip}`;
  if (captchaid) {
    key += `:${captchaid}`;
  }
  return redis.setAsync(key, text, 'EX', CAPTCHA_TIMEOUT);
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
  text,
  ip,
  captchaid = null,
) {
  const ipn = getIPv6Subnet(ip);
  let key = `capt:${ip}`;
  if (captchaid) {
    key += `:${captchaid}`;
  }
  const solution = await redis.getAsync(key);
  if (solution) {
    if (evaluateResult(solution.toString('utf8'), text)) {
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
  logger.info(`CAPTCHA ${ip}:${captchaid} timed out`);
  return 1;
}

/*
 * check if captcha is needed
 *
 * @param ip
 * @return boolean true if needed
 */
export async function needCaptcha(ip) {
  if (!CAPTCHA_URL) {
    return false;
  }

  const key = `human:${getIPv6Subnet(ip)}`;
  const ttl = await redis.ttlAsync(key);
  if (ttl > 0) {
    return false;
  }
  logger.info(`CAPTCHA ${ip} got captcha`);
  return true;
}
