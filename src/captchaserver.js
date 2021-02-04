/*
 * serving captchas
 */

import process from 'process';
import http  from 'http';
import ppfunCaptcha from 'ppfun-captcha';

/*
const [
  PORT,
  REDIS_URL,
] = process.argv.slice(2);
*/
const PORT = 7000;

const server = http.createServer((req, res) => {
  const captcha = ppfunCaptcha.create();
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  console.log(`Serving ${captcha.text} to ${ip}`);
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache',
  });
  res.write(captcha.data);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Captcha Server listening on port ${PORT}`);
});
