import * as express from 'express';
import * as iConfig from '@pasta/config-internal';

import routes from './routes';

const app = express();
routes(app);

app.listen(iConfig.adminServerPort, function () {
  console.log(`Listening at ${iConfig.adminServerPort}`);
});
