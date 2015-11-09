const config = module.exports;

if (process.env.NODE_ENV === 'development') {
  // Should be eliminated by dead-code elimination in proudction mode

  config.gameServerPort = 8000;

  config.consolePort = 9000;

  config.consoleWebpackAppPort = 9001;

  config.consoleWebpackWorkerPort = 9002;

  config.compilerPort = 9100;

  config.compilerWebpackPort = 9101;

  config.navbarHeight = 56;

  config.consoleWebpackWorkerUrl = `http://localhost:${config.consoleWebpackWorkerPort}`;

  config.compilerUrl = `http://localhost:${config.consoleWebpackWorkerPort}`;
} else {

}
