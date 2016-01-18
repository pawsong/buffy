// Run patch in entry point
import 'babel-polyfill';
import * as Promise from 'bluebird';
import * as cors from 'cors';

import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as jwt from 'express-jwt';
import * as conf from '@pasta/config';
import routes from './routes'

Promise.config({ warnings: false });;

const app = require('express')();

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
  mongoose.connect(conf.mongoUri);

  await new Promise((resolve, reject) => {
    app.listen(conf.addonCodeEditorServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.addonCodeEditorServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
