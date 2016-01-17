// Run patch in entry point
import 'babel-polyfill';
import * as Promise from 'bluebird';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import routes from './routes';
import * as conf from '@pasta/config';

// Surpress annoying warnings
Promise.config({ warnings: false });

const app = require('express')();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  origin: true,
  credentials: true,
}));

routes(app);

(async () => {
  mongoose.connect(conf.mongoUri);

  await new Promise((resolve, reject) => {
    app.listen(conf.authServerPort, err => err ? reject(err) : resolve());
  });
  console.log(`Listening at *:${conf.authServerPort}`);
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
