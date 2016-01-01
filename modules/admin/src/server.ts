import * as express from 'express';
import {
  adminServerPort,
} from '@pasta/config-internal';

import routes from './routes';

const app = express();
routes(app);

app.listen(adminServerPort, function () {
  console.log(`Listening at ${adminServerPort}`);
});
