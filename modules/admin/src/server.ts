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

const tmplDirName = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const tmplPath = `${__dirname}/../build/${tmplDirName}`;

if (process.env.NODE_ENV !== 'production') {
  app.use('/public', express.static(`${tmplPath}/public`));
}

const template = fs.readFileSync(`${tmplPath}/index.html`).toString();
app.get('*', (req, res) => {
  res.send(template);
});

app.listen(adminServerPort, function () {
  console.log(`Listening at ${adminServerPort}`);
});
