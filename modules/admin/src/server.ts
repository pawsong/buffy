import 'babel-polyfill';
import * as express from 'express';
import * as request from 'request';
import * as fs from 'fs';
import {
  adminServerPort,
  adminWebpackAppPort,
} from '@pasta/config';

import auth from './auth';

const app = express();

// app.use('/auth', auth);
// app.use((req, res, next) => {
//   if (req.user) { return next(); }
//   return res.redirect('/auth/login');
// });

app.use('/handbook', express.static(`${__dirname}/../../_book`));

const template = fs.readFileSync(`${__dirname}/index.html`).toString();
if (process.env.NODE_ENV !== 'production') {
  app.use('/public', express.static(`${__dirname}/client/public`));
}

app.get('*', (req, res) => {
  res.send(template);
});

app.listen(adminServerPort, function () {
  console.log(`Listening at ${adminServerPort}`);
});
