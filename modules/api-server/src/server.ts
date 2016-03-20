import 'babel-polyfill';

import * as Promise from 'bluebird';
Promise.config({ warnings: false });

import * as express from 'express';
import * as compress from 'compression';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as conf from '@pasta/config';
import * as jwt from 'express-jwt';

import routes from './routes';

const app = express();

app.use(compress());
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
    app.listen(conf.apiServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.apiServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
