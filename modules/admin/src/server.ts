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
app.get('*', (req, res) => {
  res.redirect('/handbook');
});

// if (process.env.NODE_ENV === 'development') {
//   app.get('*', (req, res) => {
//     request(`http://localhost:${adminWebpackAppPort}`).pipe(res)
//   });
// } else {
//   // TODO: Read local index.html file
//   //fs.readFileSync(__dirname + '/index.html
//   app.get('*', (req, res) => {
//     res.send({});
//   });
// }

app.listen(adminServerPort, function () {
  console.log(`Listening at ${adminServerPort}`);
});
