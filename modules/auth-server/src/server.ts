// Run patch in entry point
import 'babel-polyfill';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import routes from './routes';
import * as conf from '@pasta/config';

import * as express from 'express';
import * as compress from 'compression';

const app = express();

app.use(compress());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  origin: true,
  credentials: true,
}));

routes(app);

(async () => {
  mongoose.connect(conf.mongoUri);

  await new Promise((resolve, reject) => {
    app.listen(conf.authServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.authServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
