/*
 * serving captchas
 */

/* eslint-disable no-console */

import path from 'path';
import fs from 'fs';
import process from 'process';
import http from 'http';
import url from 'url';
import ppfunCaptcha from 'ppfun-captcha';

import { connect as connectRedis } from './data/redis';
import { getIPFromRequest } from './utils/ip';
import { setCaptchaSolution } from './utils/captcha';
import { getRandomString } from './core/utils';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const font = fs.readdirSync(path.resolve(__dirname, 'captchaFonts'))
  .filter((e) => e.endsWith('.ttf'))
  .map((e) => ppfunCaptcha.loadFont(
    path.resolve(__dirname, 'captchaFonts', e),
  ));

const server = http.createServer((req, res) => {
  console.log(req.url);

  req.on('error', (err) => {
    console.error(err);
  });

  const urlObject = url.parse(req.url, true);

  if (req.method === 'GET' && urlObject.pathname.endsWith('.svg')) {
    try {
      const captcha = ppfunCaptcha.create({
        width: 500,
        height: 300,
        fontSize: 180,
        stroke: 'black',
        fill: 'none',
        nodeDeviation: 2.5,
        connectionPathDeviation: 10.0,
        style: 'stroke-width: 4;',
        background: '#EFEFEF',
        font,
      });

      const ip = getIPFromRequest(req);
      const captchaid = getRandomString();

      setCaptchaSolution(captcha.text, ip, captchaid);
      console.log(`Serving ${captcha.text} to ${ip} / ${captchaid}`);

      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
        'Captcha-Id': captchaid,
      });
      res.write(captcha.data);
      res.end();
    } catch (error) {
      console.error(error);
      res.writeHead(503, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      });
      res.end(
        // eslint-disable-next-line max-len
        '<html><body><h1>Captchaserver: 503 Server Error</h1>Captchas are accessible via *.svp paths</body></html>',
      );
    }
  } else {
    res.writeHead(404, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    });
    res.end(
      // eslint-disable-next-line max-len
      '<html><body><h1>Captchaserver: 404 Not Found</h1>Captchas are accessible via *.svp paths</body></html>',
    );
  }
});

// connect to redis
connectRedis()
  .then(() => {
    // start http server
    const startServer = () => {
      server.listen(PORT, HOST, () => {
        console.log(`Captcha Server listening on port ${PORT}`);
      });
    };
    startServer();
    // catch errors of server
    server.on('error', (e) => {
      console.error(
        `Captcha Server Error ${e.code} occured, trying again in 5s...`,
      );
      setTimeout(() => {
        server.close();
        startServer();
      }, 5000);
    });
  });
