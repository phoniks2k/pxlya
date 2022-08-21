/*
 * check if an ip is a proxy via proxycheck.io
 */

/* eslint-disable max-classes-per-file */

import https from 'https';

import { HOUR } from '../core/constants';
import { HourlyCron } from './cron';


/*
 * class to serve proxyckec.io key
 * One paid account is allowed to have one additional free account,
 * which is good for fallback, if something goes wrong
 */
class PcKeyProvider {
  /*
   * @param pcKeys comma seperated list of keys
   */
  constructor(pcKeys, logger) {
    const keys = (pcKeys)
      ? pcKeys.split(',')
      : [];
    if (!keys.length) {
      logger.info('You have to define PROXYCHECK_KEY to use proxycheck.io');
    }
    this.updateKeys = this.updateKeys.bind(this);
    /*
     * [
     *   [
     *     key,
     *     availableQueries: how many queries still available today,
     *     dailyLimit: how many queries available for today,
     *     burstAvailable: how many burst tokens available,
     *     denied: if key got denied
     *   ],..
     * ]
     */
    this.availableKeys = [];
    this.disabledKeys = [];
    this.logger = logger;
    this.getKeysUsage(keys);
    HourlyCron.hook(this.updateKeys);
  }

  /*
   * @return random available pcKey
   * disable key if close to daily limit
   */
  getKey() {
    const { availableKeys: keys } = this;
    while (keys.length) {
      const pos = Math.floor(Math.random() * keys.length);
      const keyData = keys[pos];
      const availableQueries = keyData[1] - 1;
      if (availableQueries >= 30) {
        keyData[1] = availableQueries;
        return keyData[0];
      }
      this.logger(`PCKey: ${keyData[0]} close to daily limit, disabling it`);
      keys.splice(pos, 1);
      this.disabledKeys.push(keyData);
    }
    return this.enableBurst();
  }

  /*
   * select one available disabled key that is at daily limit and re-enabled it
   * to overuse it times 5
   */
  enableBurst() {
    const keyData = this.disabledKeys.find((k) => !k[4] && k[3] > 0);
    if (!keyData) {
      return null;
    }
    this.logger.info(`PCKey: ${keyData[0]}, using burst`);
    const pos = this.disabledKeys.indexOf(keyData);
    this.disabledKeys.splice(pos, 1);
    keyData[1] += keyData[2] * 4;
    keyData[2] *= 5;
    this.availableKeys.push(keyData);
    return keyData[0];
  }

  /*
   * get usage data of array of keys and put them into available / diabledKeys
   * @param keys Array of key strings
   */
  async getKeysUsage(keys) {
    for (let i = 0; i < keys.length; i += 1) {
      let key = keys[i];
      if (typeof key !== 'string') {
        [key] = key;
      }
      // eslint-disable-next-line no-await-in-loop
      await this.getKeyUsage(key);
    }
  }

  /*
   * get usage data of key and put him into availableKeys or disabledKeys
   * @param key string
   */
  async getKeyUsage(key) {
    let usage;
    try {
      try {
        usage = await PcKeyProvider.requestKeyUsage(key);
      } finally {
        let pos = this.availableKeys.findIndex((k) => k[0] === key);
        if (~pos) this.availableKeys.splice(pos, 1);
        pos = this.disabledKeys.findIndex((k) => k[0] === key);
        if (~pos) this.disabledKeys.splice(pos, 1);
      }
    } catch (err) {
      this.logger.info(`PCKey: ${key}, Error ${err.message}`);
      this.disabledKeys.push([
        key,
        0,
        0,
        0,
        true,
      ]);
      return;
    }
    const queriesToday = Number(usage['Queries Today']) || 0;
    const availableBurst = Number(usage['Burst Tokens Available']) || 0;
    let dailyLimit = Number(usage['Daily Limit']) || 0;
    let burstActive = false;
    let availableQueries = dailyLimit - queriesToday;
    if (availableQueries < 0) {
      burstActive = true;
      dailyLimit *= 5;
      availableQueries = dailyLimit - queriesToday;
    }
    // eslint-disable-next-line max-len
    this.logger.info(`PCKey: ${key}, Queries Today: ${availableQueries} / ${dailyLimit} (Burst: ${availableBurst}, ${burstActive ? 'active' : 'inactive'})`);
    const keyData = [
      key,
      availableQueries,
      dailyLimit,
      availableBurst,
      false,
    ];
    if (burstActive || availableQueries > 30) {
      /*
       * data is a few minutes old, stop at 30
       */
      this.availableKeys.push(keyData);
    } else {
      this.disabledKeys.push(keyData);
    }
  }

  /*
   * query the API for limits
   * @param key
   */
  static requestKeyUsage(key) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'proxycheck.io',
        path: `/dashboard/export/usage/?key=${key}`,
        method: 'GET',
      };

      const req = https.request(options, (res) => {
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
            const jsonString = data.join('');
            const result = JSON.parse(jsonString);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });
      req.end();
    });
  }

  /*
   * wrapper to update keys
   */
  updateKeys() {
    this.pcKeyProvider.updateKeys();
  }

  /*
   * report denied key (over daily quota, rate limited, blocked,...)
   * @param key
   */
  denyKey(key) {
    const { availableKeys: keys } = this;
    const pos = keys.findIndex((k) => k[0] === key);
    if (~pos) {
      const keyData = keys[pos];
      keyData[4] = true;
      keys.splice(pos, 1);
      this.disabledKeys.push(keyData);
    }
  }

  /*
   * allow all denied keys again
   */
  async updateKeys() {
    await this.getKeysUsage(this.availableKeys);
    await this.getKeysUsage(this.disabledKeys);
  }
}


class ProxyCheck {
  constructor(pcKeys, logger) {
    /*
     * queue of ip-checking tasks
     * [[ip, callbackFunction],...]
     */
    this.ipQueue = [];
    this.fetching = false;
    this.checkFromQueue = this.checkFromQueue.bind(this);
    this.checkIp = this.checkIp.bind(this);
    this.pcKeyProvider = new PcKeyProvider(pcKeys, logger);
    this.logger = logger;
  }

  reqProxyCheck(ips) {
    return new Promise((resolve, reject) => {
      const key = this.pcKeyProvider.getKey();
      if (!key) {
        setTimeout(
          () => reject(new Error('No pc key available')),
          5000,
        );
        return;
      }
      const postData = `ips=${ips.join(',')}`;

      const options = {
        hostname: 'proxycheck.io',
        path: `/v2/?vpn=1&asn=1&key=${key}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
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
            const jsonString = data.join('');
            const result = JSON.parse(jsonString);
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
                this.pcKeyProvider.denyKey(key);
              }
              if (result.status !== 'warning') {
                throw new Error(`${key}: ${result.message}`);
              } else {
                this.logger.warn(`Warning: ${key}: ${result.message}`);
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

  async checkFromQueue() {
    const { ipQueue } = this;
    if (!ipQueue.length) {
      this.fetching = false;
      return;
    }
    this.fetching = true;
    const tasks = ipQueue.slice(0, 50);
    const ips = tasks.map((i) => i[0]);
    let res = {};
    try {
      res = await this.reqProxyCheck(ips);
    } catch (err) {
      this.logger.error(`Eroor: ${err.message}`);
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
        this.logger.info(`${ip}: ${JSON.stringify(res[ip])}`);
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
    setTimeout(this.checkFromQueue, 10);
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
  checkIp(ip) {
    return new Promise((resolve) => {
      this.ipQueue.push([ip, resolve]);
      if (!this.fetching) {
        this.checkFromQueue();
      }
    });
  }
}

export default ProxyCheck;
