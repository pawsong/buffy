const config = module.exports;

config.navbarHeight = 56;

if (process.env.NODE_ENV === 'development') {
  // Should be eliminated by dead-code elimination in proudction mode

  const iConfig = require('@pasta/config-internal');

  config.consolePublicPath =
    `http://localhost:${iConfig.consoleWebpackAppPort}/`;

  config.gameServerUrl =
    `http://localhost:${iConfig.gameServerPort}`;

} else {

  config.consolePublicPath =
    'https://pasta-prod.s3-ap-northeast-1.amazonaws.com/';

  config.gameServerUrl =
    `http://localhost:8000`;

}
