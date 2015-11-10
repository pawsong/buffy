const config = module.exports;

config.navbarHeight = 56;

if (process.env.NODE_ENV === 'development') {
  // Should be eliminated by dead-code elimination in proudction mode
  const iConfig = require('@pasta/config-internal');

  config.gameServerUrl = `http://localhost:${iConfig.gameServerPort}`;
} else {
  config.gameServerUrl = `http://localhost:8000`;
}
