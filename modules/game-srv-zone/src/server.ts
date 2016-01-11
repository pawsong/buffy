// Run patch in entry point
import 'babel-polyfill';
import * as Promise from 'bluebird';
import * as cors from 'cors';
import mongodb from '@pasta/mongodb';
global.Promise = Promise;

import ioHandler from './io';

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

import { initMap } from './map';

import * as iConfig from '@pasta/config-internal';

app.use(cors());

ioHandler(io);

(async () => {
  mongodb.mongoose.connect(iConfig.mongoUri);
  await initMap();

  http.listen(iConfig.gameServerPort);
  console.log(`Listening at *:${iConfig.gameServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
