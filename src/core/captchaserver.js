/*
 * creation of captchas
 */

import { Worker } from 'worker_threads';

import logger from './logger';

const MAX_WAIT = 20 * 1000;

/*
 * worker thread
 */
const worker = new Worker('./workers/captchaloader.js');

/*
 * queue of captcha-generation tasks
 * [[ timestamp, callbackFunction ],...]
 */
let captchaQueue = [];

/*
 * generate a captcha in the worker thread
 * calls callback with arguments:
 *  (error, captcha.text, captcha.svgdata, captcha.id)
 */
function requestCaptcha(cb) {
  worker.postMessage('createCaptcha');
  captchaQueue.push([
    Date.now(),
    cb,
  ]);
}

/*
 * answer of worker thread
 */
worker.on('message', (msg) => {
  const task = captchaQueue.shift();
  task[1](...msg);
});

/*
 * checks queue of captcha requests for stale
 * unanswered requests
 */
function clearOldQueue() {
  const now = Date.now();
  captchaQueue = captchaQueue.filter((task) => {
    if (now - task[0] > MAX_WAIT) {
      logger.warn(
        'Captchas: Thread took longer than 30s to generate captcha',
      );
      try {
        task[1]('TIMEOUT');
      } catch {
        // nothing
      }
      return false;
    }
    return true;
  });
}

setInterval(clearOldQueue, MAX_WAIT);

export default requestCaptcha;
