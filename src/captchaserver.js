/*
 * serving captchas
 */

/* eslint-disable no-console */

import process from 'process';
import http from 'http';
import ppfunCaptcha from 'ppfun-captcha';

import { getIPFromRequest } from './utils/ip';
import { setCaptchaSolution } from './utils/captcha';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const server = http.createServer((req, res) => {
  const captcha = ppfunCaptcha.create({
    width: 500,
    height: 300,
    fontSize: 220,
    stroke: 'black',
    fill: 'none',
    nodeDeviation: 3.0,
    connectionPathDeviation: 3.0,
    style: 'stroke-width: 4;',
    background: '#EFEFEF',
  });

  const ip = getIPFromRequest(req);

  setCaptchaSolution(captcha.text, ip);
  console.log(`Serving ${captcha.text} to ${ip}`);

  res.writeHead(200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'no-cache',
  });
  res.write(captcha.data);
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Captcha Server listening on port ${PORT}`);
});
