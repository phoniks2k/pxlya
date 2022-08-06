/*
 * decide if IP is allowed
 * does proxycheck and check bans and whitelists
 */
import fetch from '../utils/proxiedFetch';

import { getIPv6Subnet } from '../utils/ip';
import whois from '../utils/whois';
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
 * check getipintel if IP is proxy
 * Use proxiedFetch with random proxies and random mail for it, to not get blacklisted
 * @param ip IP to check
 * @return true if proxy, false if not
 */
// eslint-disable-next-line no-unused-vars
async function getIPIntel(ip) {
  // eslint-disable-next-line max-len
  const email = `${Math.random().toString(36).substring(8)}-${Math.random().toString(36).substring(4)}@gmail.com`;
  // eslint-disable-next-line max-len
  const url = `http://check.getipintel.net/check.php?ip=${ip}&contact=${email}&flags=m`;
  logger.info(`fetching getipintel ${url}`);
  const response = await fetch(url, {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      Referer: 'http://check.getipintel.net/',
      // eslint-disable-next-line max-len
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`getipintel not ok ${response.status}/${text}`);
  }
  const body = await response.text();
  logger.info('PROXYCHECK %s : %s', ip, body);
  // returns tru iff we found 1 in the response and was ok (http code = 200)
  const value = parseFloat(body);
  return [
    value > 0.995,
    `score:${value}`,
  ];
}

/*
 * check proxycheck.io if IP is proxy
 * Use proxiedFetch with random proxies
 * @param ip IP to check
 * @return [ isProxy, info] true if proxy and extra info
 */
async function getProxyCheck(ip) {
  const url = `http://proxycheck.io/v2/${ip}?risk=1&vpn=1&asn=1`;
  logger.info('fetching proxycheck %s', url);
  const response = await fetch(url, {
    headers: {
      // eslint-disable-next-line max-len
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`proxycheck not ok ${response.status}/${text}`);
  }
  const data = await response.json();
  logger.info('PROXYCHECK', data);
  if (!data.status) {
    return [
      false,
      'status not ok',
    ];
  }
  const ipData = data[ip];
  return [
    ipData.proxy === 'yes',
    `${ipData.type},${ipData.city}`,
  ];
}

/*
 * dummy function to include if you don't want any proxycheck
 */
async function dummy() {
  return [false, 'dummy'];
}

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
  let pcInfo = null;
  let whoisRet = null;

  try {
    if (await isWhitelisted(ipKey)) {
      allowed = true;
      pcInfo = 'wl';
      status = -1;
    } else if (await isIPBanned(ipKey)) {
      allowed = false;
      pcInfo = 'bl';
      status = 2;
    } else {
      [allowed, pcInfo] = await f(ip);
      allowed = !allowed;
      status = (allowed) ? 0 : 1;
    }
    whoisRet = await whois(ip) || {};
  } finally {
    await saveIPInfo(ipKey, whoisRet, status, pcInfo);
  }

  return {
    allowed,
    status,
  };
}

/*
 * execute proxycheck without caching results for 3 days
 * do not check more than 3 at a time, do not check ip double
 * @param f function for checking if proxy
 * @param ip IP to check
 * @return true if proxy or blacklisted, false if not or whitelisted
 */
let lock = 4;
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
  // use lock to just check three at a time
  // do not check ip that currently gets checked
  if (checking.indexOf(ipKey) === -1 && lock > 0) {
    lock -= 1;
    checking.push(ipKey);
    withoutCache(f, ip)
      .then((result) => {
        cacheAllowed(ipKey, result);
      })
      .catch((error) => {
        logger.error('Error %s', error.message || error);
      })
      .finally(() => {
        const pos = checking.indexOf(ipKey);
        if (~pos) checking.splice(pos, 1);
        lock += 1;
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
