import 'babel-polyfill';
import * as express from 'express';
import * as conf from '@pasta/config';

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.redirect(`http://localhost:${conf.addonGameClientPort}/client.js`);
  });
} else {
  app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/client.js`);
  });
}

(async () => {
  await new Promise((resolve, reject) => {
    app.listen(conf.addonGameServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.addonGameServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
