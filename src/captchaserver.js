/*
 * serving captchas
 */

/* eslint-disable no-console */

import process from 'process';
import http from 'http';
import ppfunCaptcha from 'ppfun-captcha';

const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || 'localhost';

const server = http.createServer((req, res) => {
  const captcha = ppfunCaptcha.create({
    width: 700,
    height: 500,
    fontSize: 600,
    stroke: 'black',
    fill: 'none',
    background: 'white',
    nodeDeviation: 0.5,
    connectionPathDeviation: 0.3,
  });
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  console.log(`Serving ${captcha.text} to ${ip}`);
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache',
  });
  res.write(captcha.data);
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Captcha Server listening on port ${PORT}`);
});
