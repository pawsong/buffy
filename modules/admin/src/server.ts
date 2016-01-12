import './patch/es.node';
import 'babel-polyfill';
import * as express from 'express';
import * as request from 'request';
import * as fs from 'fs';
import {
  adminServerPort,
  adminWebpackAppPort,
} from '@pasta/config-internal';

import auth from './auth';

const app = express();

// app.use('/auth', auth);
// app.use((req, res, next) => {
//   if (req.user) { return next(); }
//   return res.redirect('/auth/login');
// });

app.use('/handbook', express.static(__dirname + '/../../../_book'));

let template;
if (process.env.NODE_ENV !== 'production') {
  template = fs.readFileSync(`${__dirname}/app/dev/index.html`).toString();
  app.use('/public', express.static(`${__dirname}/app/dev/public`));
} else {
  template = fs.readFileSync(`${__dirname}/app/prod/index.html`).toString();
}

app.get('*', (req, res) => {
  res.send(template);
});

app.listen(adminServerPort, function () {
  console.log(`Listening at ${adminServerPort}`);
});
