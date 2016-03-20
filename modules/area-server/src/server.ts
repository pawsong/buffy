// Run patch in entry point
import 'babel-polyfill';
import * as Promise from 'bluebird';
import * as cors from 'cors';
import * as mongoose from 'mongoose';
import httpHandler from './http';
import ioHandler from './io';
import * as socketIo from 'socket.io';
import * as express from 'express';
import * as compress from 'compression';

// Surpress annoying warnings
Promise.config({ warnings: false });

const app = express();

app.use(compress());
const http = require('http').Server(app);
const io = socketIo(http);

// import { initMap } from './map';

import * as conf from '@pasta/config';

httpHandler(app);
ioHandler(io);

(async () => {
  mongoose.connect(conf.mongoUri);
//  await initMap();

  await new Promise((resolve, reject) => {
    http.listen(conf.gameServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.gameServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
