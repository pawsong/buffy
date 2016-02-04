import 'babel-polyfill';

import * as express from 'express';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

import * as conf from '@pasta/config';

import * as cheerio from 'cheerio';

import addonProxy from './addonProxy';

import modRewrite = require('connect-modrewrite');

const template = (() => {
  if (process.env.NODE_ENV !== 'production') {
    const html = require('raw!../index.html');
    const $ = cheerio.load(html);
    $('body').append(`<script src="http://localhost:${conf.consoleClientPort}/bundle.js"></script>`);
    return $.html();
  } else {
    return fs.readFileSync(`${__dirname}/index.html`, 'utf8');
  }
})();
const compiled = _.template(template);
const indexHtml = compiled({ facebookAppId: CONFIG_FACEBOOK_APP_ID });

const app = express();
app.use('/addons', addonProxy);

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
