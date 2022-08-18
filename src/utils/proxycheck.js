/*
 * check if an ip is a proxy via proxycheck.io
 */
import http from 'http';

import { proxyLogger as logger } from '../core/logger';
import { PROXYCHECK_KEY } from '../core/config';
import { HOUR } from '../core/constants';


/*
 * class to serve proxyckec.io key
 * One paid account is allowed to have one additional free account,
 * which is good for fallback, if something goes wrong
 */
class PcKeyProvider {
  /*
   * @param pcKeys comma seperated list of keys
   */
  constructor(pcKeys) {
    let keys = (pcKeys)
      ? pcKeys.split(',')
      : [];
    keys = keys.map((k) => k.trim());
    if (keys.length) {
      logger.info(`Loaded pc Keys: ${keys}`);
    } else {
      logger.info(`You have to define PROXYCHECK_KEY to use proxycheck.io`);
    }
    this.availableKeys = keys;
    this.deniedKeys = [];
    this.retryDeniedKeys = this.retryDeniedKeys.bind(this);
    setInterval(this.retryDeniedKeys, HOUR);
  }

  /*
   * @return random available pcKey
   */
  getKey() {
    const { availableKeys: keys } = this;
    if (!keys.length) {
      return null;
    }
    return keys[Math.floor(Math.random() * keys.length)];
  }

  /*
   * report denied key (over daily quota, rate limited, blocked,...)
   * @param key
   */
  denyKey(key) {
    const { availableKeys: keys } = this;
    const pos = keys.indexOf(key);
    if (~pos) {
      keys.splice(pos, 1);
      this.deniedKeys.push(key);
    }
  }

  /*
   * allow all denied keys again
   */
  retryDeniedKeys() {
    const { deniedKeys } = this;
    if (!deniedKeys.length) {
      return;
    }
    logger.info(`Retry denied Keys ${deniedKeys}`);
    this.availableKeys = this.availableKeys.concat(deniedKeys);
    this.deniedKeys = [];
  }
}

const pcKeyProvider = new PcKeyProvider(PROXYCHECK_KEY);

/*
 * queue of ip-checking tasks
 * [[ip, callbackFunction],...]
 */
const ipQueue = [];

let fetching = false;

function reqProxyCheck(ips) {
  return new Promise((resolve, reject) => {
    const key = pcKeyProvider.getKey();
    if (!key) {
      setTimeout(
        () => reject(new Error('No pc key available')),
        5000,
      );
      return;
    }
    const postData = `ips=${ips.join(',')}`;
    const path = `/v2/?vpn=1&asn=1&key=${key}`;
    logger.info(`Request for ${postData}`);

    const options = {
      hostname: 'proxycheck.io',
      port: 80,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status not 200: ${res.statusCode}`));
        return;
      }
      res.setEncoding('utf8');
      const data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data.join(''));
          if (result.status !== 'ok') {
            if (result.status === 'error' && ips.length === 1) {
              /*
               * invalid ip, like a link local address
               * Error is either thrown in the top, when requesting only one ip
               * or in the ip-part as "error": "No valid.." when multiple
               * */
              resolve({
                [ips[0]]: {
                  proxy: 'yes',
                  type: 'Invalid IP',
                },
              });
              return;
            }
            if (result.status === 'denied') {
              pcKeyProvider.denyKey(key);
            }
            if (result.status !== 'warning') {
              throw new Error(`${key}: ${result.message}`);
            } else {
              logger.warn(`Warning: ${key}: ${result.message}`);
            }
          }
          ips.forEach((ip) => {
            if (result[ip] && result[ip].error) {
              result[ip] = {
                proxy: 'yes',
                type: 'Invalid IP',
              };
            }
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    req.write(postData);
    req.end();
  });
}

async function checkFromQueue() {
  if (!ipQueue.length) {
    fetching = false;
    return;
  }
  fetching = true;
  const tasks = ipQueue.slice(0, 50);
  const ips = tasks.map((i) => i[0]);
  let res = {};
  try {
    res = await reqProxyCheck(ips);
  } catch (err) {
    logger.error(`Eroor: ${err.message}`);
  }
  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];

    const pos = ipQueue.indexOf(task);
    if (~pos) ipQueue.splice(pos, 1);

    const [ip, cb] = task;

    let allowed = true;
    let status = -2;
    let pcheck = 'N/A';

    if (res[ip]) {
      const { proxy, type, city } = res[ip];
      allowed = proxy === 'no';
      status = (allowed) ? 0 : 1;
      pcheck = `${type},${city}`;
    }

    cb({
      allowed,
      status,
      pcheck,
    });
  }
  setTimeout(checkFromQueue, 10);
}

/*
 * check if ip is proxy in queue
 * @param ip
 * @return Promise that resolves to
 * {
 *   status, 0: no proxy 1: proxy -2: any failure
 *   allowed, boolean if ip should be allowed to place
 *   pcheck, string info of proxycheck return (like type and city)
 * }
 */
function checkForProxy(ip) {
  return new Promise((resolve) => {
    ipQueue.push([ip, resolve]);
    if (!fetching) {
      checkFromQueue();
    }
  });
}

export default checkForProxy;
