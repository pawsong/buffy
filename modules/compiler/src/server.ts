import 'babel-polyfill';

import * as express from 'express';
import * as bodyParser from 'body-parser';

import compiler from './compiler';
import * as conf from '@pasta/config';

import routes from './routes';

(async () => {
  await compiler.init();

  const app = express();
  app.use(bodyParser.json());

  routes(app);

  await new Promise((resolve, reject) => {
    app.listen(conf.compilerPort, err => err ? reject(err) : resolve());
  });

  console.log(`Listening at *:${conf.compilerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
