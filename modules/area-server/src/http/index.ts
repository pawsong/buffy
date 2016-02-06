import * as express from 'express';
import * as ejwt from 'express-jwt';
import routes from './routes';

import * as Promise from 'bluebird';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

export default (app: express.Express) => {
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  }));
  routes(app);
};
