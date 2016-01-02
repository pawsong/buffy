// Run patch in entry point
import * as Promise from 'bluebird';
import * as cors from 'cors';
global.Promise = Promise;

import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { mongoose } from '@pasta/mongodb';
import * as jwt from 'express-jwt';

import routes from './routes';

const app = require('express')();
const http = require('http').Server(app);

import * as iConfig from '@pasta/config-internal';

app.use(cookieParser());
app.use(bodyParser.json({
  limit: '50mb',
}));
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(jwt({
  secret: iConfig.jwtSecret,
  credentialsRequired: false,
  getToken: req => req.cookies.tt,
}));

routes(app);

(async () => {
  mongoose.connect(iConfig.mongoUri);

  await new Promise((resolve, reject) => {
    http.listen(iConfig.apiServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${iConfig.apiServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
