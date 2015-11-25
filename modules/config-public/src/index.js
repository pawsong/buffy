const config = module.exports;

config.navbarHeight = 48;

if (process.env.NODE_ENV !== 'production') {
  // Should be eliminated by dead-code elimination in proudction mode

  const iConfig = require('@pasta/config-internal');

  config.consolePublicPath =
    `http://localhost:${iConfig.consoleWebpackAppPort}/`;

  config.gameServerUrl =
    `http://localhost:${iConfig.gameServerPort}`;

  config.apiServerUrl =
    `http://localhost:${iConfig.apiServerPort}`;

  config.facebookAppId = '1127122043982378';
} else {

  config.consolePublicPath =
    'https://pasta-prod.s3-ap-northeast-1.amazonaws.com/';

  config.gameServerUrl =
    `http://zone.html5.computer`;

  config.apiServerUrl =
    `http://api.html5.computer`;

  config.facebookAppId = '1127121857315730';

  config.domain = 'html5.computer';
}
