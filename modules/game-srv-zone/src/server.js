// Run patch in entry point
import Promise from 'bluebird';
import cors from 'cors';
import mongoose from 'mongoose';
global.Promise = Promise;

import ioHandler from './io';

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

import iConfig from '@pasta/config-internal';

app.use(cors());

ioHandler(io);

(async () => {
  mongoose.connect(iConfig.mongoUri);

  await new Promise(resolve => {
    http.listen(iConfig.gameServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${iConfig.gameServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
