const config = module.exports;

if (process.env.NODE_ENV === 'development') {
  // Should be eliminated by dead-code elimination in proudction mode

  const iConfig = require('@pasta/config-internal');

  config.navbarHeight = 56;

  config.gameServerUrl = `http://localhost:${iConfig.gameServerPort}`;
} else {

}
