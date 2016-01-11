import { PastaConfig } from './index';

const iConfig = require('@pasta/config-internal');

const config: PastaConfig = {
  consolePublicPath: `http://localhost:${iConfig.consoleWebpackAppPort}/`, 
  
  adminPublicPath: `http://localhost:${iConfig.adminWebpackAppPort}/`,
  
  gameServerUrl: `http://localhost:${iConfig.gameServerPort}`,
  
  apiServerUrl: `http://localhost:${iConfig.apiServerPort}`,
  
  facebookAppId: '1127122043982378',
  
  domain: '',
};

export default config;
