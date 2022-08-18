/*
 * decide if IP is allowed
 * does proxycheck and check bans and whitelists
 */
import { getIPv6Subnet } from '../utils/ip';
import whois from '../utils/whois';
import getProxyCheck from '../utils/proxycheck';
import { IPInfo } from '../data/sql';
import { isIPBanned } from '../data/sql/Ban';
import { isWhitelisted } from '../data/sql/Whitelist';
import {
  cacheAllowed,
  getCacheAllowed,
} from '../data/redis/isAllowedCache';
import { proxyLogger as logger } from './logger';

import { USE_PROXYCHECK } from './config';

/*
 * dummy function to include if you don't want any proxycheck
 */
async function dummy() {
  return {
    allowed: true,
    status: 0,
    pcheck: 'dummy',
  };
}

/*
 * save information of ip into database
 */
async function saveIPInfo(ip, whoisRet, allowed, info) {
  try {
    await IPInfo.upsert({
      ...whoisRet,
      ip,
      proxy: allowed,
      pcheck: info,
    });
  } catch (error) {
    logger.error(`Error whois for ${ip}: ${error.message}`);
  }
}

/*
 * execute proxycheck without caring about cache
 * @param f function for checking if proxy
 * @param ip IP to check
 * @return true if proxy or blacklisted, false if not or whitelisted
 */
async function withoutCache(f, ip) {
  const ipKey = getIPv6Subnet(ip);
  let allowed = true;
  let status = -2;
  let pcheck = null;
  let whoisRet = null;

  try {
    if (await isWhitelisted(ipKey)) {
      allowed = true;
      pcheck = 'wl';
      status = -1;
    } else if (await isIPBanned(ipKey)) {
      allowed = false;
      pcheck = 'bl';
      status = 2;
    } else {
      const res = await f(ip);
      status = res.status;
      allowed = res.allowed;
      pcheck = res.pcheck;
      if (status === -2) {
        throw new Error('Proxycheck request did not return yet');
      }
    }
    cacheAllowed(ipKey, status);
    whoisRet = await whois(ip);
  } finally {
    await saveIPInfo(ipKey, whoisRet || {}, status, pcheck);
  }

  return {
    allowed,
    status,
  };
}

/*
 * execute proxycheck with caching results
 * do not check ip double
 * @param f function for checking if proxy
 * @param ip IP to check
 * @return Object as in checkIfAllowed
 * @return true if proxy or blacklisted, false if not or whitelisted
 */
const checking = [];
async function withCache(f, ip) {
  if (!ip || ip === '0.0.0.1') {
    return {
      allowed: false,
      status: 4,
    };
  }
  // get from cache, if there
  const ipKey = getIPv6Subnet(ip);
  const cache = await getCacheAllowed(ipKey);
  if (cache) {
    return cache;
  }

  // else make asynchronous ipcheck and assume no proxy in the meantime
  // do not check ip that currently gets checked
  if (checking.indexOf(ipKey) === -1) {
    checking.push(ipKey);
    withoutCache(f, ip)
      .catch((error) => {
        logger.error('Error %s', error.message);
      })
      .finally(() => {
        const pos = checking.indexOf(ipKey);
        if (~pos) checking.splice(pos, 1);
      });
  }
  return {
    allowed: true,
    status: -2,
  };
}

/*
 * check if ip is allowed
 * @param ip IP
 * @param disableCache if we fetch result from cache
 * @return {
 *     allowed: boolean if allowed to use site
 * ,   status:  -2: not yet checked
 *              -1: whitelisted
 *              0: allowed, no proxy
 *              1  is proxy
 *              2: is banned
 *              3: is rangebanned
 *              4: invalid ip
 *   }
 */
function checkIfAllowed(ip, disableCache = false) {
  const checker = (USE_PROXYCHECK) ? getProxyCheck : dummy;
  if (disableCache) {
    return withoutCache(checker, ip);
  }
  return withCache(checker, ip);
}

export default checkIfAllowed;
