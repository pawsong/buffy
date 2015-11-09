// Run patch in entry point
import Promise from 'bluebird';
global.Promise = Promise;

import ioHandler from './io';

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

import config from '@pasta/config';

ioHandler(io);

(async () => {
  await new Promise(resolve => {
    http.listen(config.gameServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${config.gameServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
