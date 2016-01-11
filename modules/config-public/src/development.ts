import { PastaConfig } from './index';

const iconf = require('@pasta/config-internal');

const config: PastaConfig = {
  consolePublicPath: `http://localhost:${iconf.consoleWebpackAppPort}/`,

  adminPublicPath: `http://localhost:${iconf.adminWebpackAppPort}/`,

  gameServerUrl: `http://localhost:${iconf.gameServerPort}`,

  apiServerUrl: `http://localhost:${iconf.apiServerPort}`,

  facebookAppId: '1127122043982378',

  domain: '',
};

export default config;
