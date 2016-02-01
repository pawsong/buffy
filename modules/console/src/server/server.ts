import 'babel-polyfill';

import * as express from 'express';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

import * as conf from '@pasta/config';

import addonProxy from './addonProxy';

import modRewrite = require('connect-modrewrite');

const template = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
const compiled = _.template(template);
const indexHtml = compiled({ facebookAppId: CONFIG_FACEBOOK_APP_ID });

const app = express();
app.use('/addons', addonProxy);

if (process.env.NODE_ENV !== 'production') {
  app.use('/public', express.static(`${__dirname}/client/public`));
}
app.use('/assets', express.static(`${__dirname}/../../public`));

app.use(modRewrite(['^[^\\.]*$ /index.html [L]']));
app.get('/index.html', (req, res) => res.send(indexHtml));

app.listen(conf.consolePort, err => {
  if (err) {
    console.error(err.stack);
    process.exit(1);
  }
  console.log(`Listening at *:${conf.consolePort}`);
});
