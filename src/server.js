/*
 * Entrypoint for main server script
 */

import url from 'url';
import compression from 'compression';
import express from 'express';
import http from 'http';

// import baseCss from './components/base.tcss';
import forceGC from './core/forceGC';
import logger from './core/logger';
import rankings from './core/ranking';
import models from './data/models';
import routes from './routes';
import chatProvider from './core/ChatProvider';

import SocketServer from './socket/SocketServer';
import APISocketServer from './socket/APISocketServer';


import { PORT, HOST } from './core/config';
import { SECOND } from './core/constants';

import { startAllCanvasLoops } from './core/tileserver';

startAllCanvasLoops();

const app = express();
app.disable('x-powered-by');


// Call Garbage Collector every 30 seconds
setInterval(forceGC, 15 * 60 * SECOND);

// create http server
const server = http.createServer(app);

//
// websockets
// -----------------------------------------------------------------------------
const usersocket = new SocketServer();
const apisocket = new APISocketServer();
function wsupgrade(request, socket, head) {
  const { pathname } = url.parse(request.url);

  if (pathname === '/ws') {
    usersocket.wss.handleUpgrade(request, socket, head, (ws) => {
      usersocket.wss.emit('connection', ws, request);
    });
  } else if (pathname === '/mcws') {
    apisocket.wss.handleUpgrade(request, socket, head, (ws) => {
      apisocket.wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
}
server.on('upgrade', wsupgrade);

/*
 * use gzip compression for following calls
/* level from -1 (default, 6) to 0 (no) from 1 (fastest) to 9 (best)
 * Set custon filter to make sure that .bmp files get compressed
 */
app.use(compression({
  level: 3,
  filter: (req, res) => {
    if (res.getHeader('Content-Type') === 'application/octet-stream') {
      return true;
    }
    return compression.filter(req, res);
  },
}));

app.use(routes);

//
// ip config
// -----------------------------------------------------------------------------
// use this if models changed:
const promise = models.sync({ alter: { drop: false } })
// const promise = models.sync()
  .catch((err) => logger.error(err.stack));
promise.then(() => {
  rankings.updateRanking();
  chatProvider.initialize();
  server.listen(PORT, HOST, () => {
    const address = server.address();
    logger.log(
      'info',
      `web is running at http://${address.host}:${address.port}/`,
    );
  });
});
