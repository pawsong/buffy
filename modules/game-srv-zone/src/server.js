// Run patch in entry point
import Promise from 'bluebird';
import cors from 'cors';
import { mongoose } from '@pasta/mongodb';
global.Promise = Promise;

import ioHandler from './io';

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

import { initMap } from './map';

import iConfig from '@pasta/config-internal';

app.use(cors());

ioHandler(io);

(async () => {
  mongoose.connect(iConfig.mongoUri);
  await initMap();

  http.listen(iConfig.gameServerPort);
  console.log(`Listening at *:${iConfig.gameServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
