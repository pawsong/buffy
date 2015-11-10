//import 'babel-core/polyfill';
//import Promise from 'bluebird';

import express from 'express';
import bodyParser from 'body-parser';

import compiler from './compiler';
import iConfig from '@pasta/config-internal';

import routes from './routes';

(async () => {
  await compiler.init();

  const app = express();
  app.use(bodyParser.json());

  routes(app);

  await new Promise((resolve, reject) => {
    app.listen(iConfig.compilerPort, err => err ? reject(err) : resolve());
  });

  console.log(`Listening at *:${iConfig.compilerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
