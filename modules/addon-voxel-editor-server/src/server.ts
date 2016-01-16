// Run patch in entry point
import 'babel-polyfill';
import * as Promise from 'bluebird';
import * as cors from 'cors';
global.Promise = Promise;

import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import mongodb from '@pasta/mongodb';
import * as jwt from 'express-jwt';

import routes from './routes';

const app = require('express')();
const http = require('http').Server(app);

import * as conf from '@pasta/config';

app.use(cookieParser());
app.use(bodyParser.json({
  limit: '50mb',
}));
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(jwt({
  secret: conf.jwtSecret,
  credentialsRequired: false,
  getToken: req => req.cookies.tt,
}));

routes(app);

(async () => {
  mongodb.mongoose.connect(conf.mongoUri);

  await new Promise((resolve, reject) => {
    http.listen(conf.addonVoxelEditorServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.addonVoxelEditorServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
