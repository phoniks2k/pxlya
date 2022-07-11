/*
 * Entrypoint for main server script
 */

import url from 'url';
import compression from 'compression';
import express from 'express';
import http from 'http';

import forceGC from './core/forceGC';
import logger from './core/logger';
import rankings from './core/ranking';
import sequelize from './data/sql/sequelize';
import { connect as connectRedis } from './data/redis/client';
import routes from './routes';
import chatProvider from './core/ChatProvider';
import rpgEvent from './core/RpgEvent';
import canvasCleaner from './core/CanvasCleaner';

import SocketServer from './socket/SocketServer';
import APISocketServer from './socket/APISocketServer';


import { PORT, HOST, HOURLY_EVENT } from './core/config';
import { SECOND } from './core/constants';

import { startAllCanvasLoops } from './core/tileserver';

const app = express();
app.disable('x-powered-by');


// Call Garbage Collector every 30 seconds
setInterval(forceGC, 10 * 60 * SECOND);

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
// sync sql models
sequelize.sync({ alter: { drop: false } })
  // connect to redis
  .then(connectRedis)
  .then(() => {
    rankings.initialize();
    chatProvider.initialize();
    startAllCanvasLoops();
    usersocket.initialize();
    apisocket.initialize();
    if (HOURLY_EVENT) {
      rpgEvent.initialize();
    }
    canvasCleaner.initialize();
    // start http server
    const startServer = () => {
      server.listen(PORT, HOST, () => {
        logger.log(
          'info',
          `HTTP Server listening on port ${PORT}`,
        );
      });
    };
    startServer();
    // catch errors of server
    server.on('error', (e) => {
      logger.error(
        `HTTP Server Error ${e.code} occured, trying again in 5s...`,
      );
      setTimeout(() => {
        server.close();
        startServer();
      }, 5000);
    });
  });
