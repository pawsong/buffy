'use strict'; // eslint-disable-line

const iconf = require('@pasta/config');

require('../../gulp/universal')({
  prefix: 'console',
  port: iconf.consolePort,
  devPort: iconf.consoleDevPort,
  main: 'build/dev/server',
  webpackConfig: {
    server: {
      dev: require('./webpack/server.dev'),
      prod: require('./webpack/server.prod'),
    },
    client: {
      dev: {
        app: require('./webpack/app.dev'),
        worker: require('./webpack/worker.dev'),
      },
      prod: {
        app: require('./webpack/app.prod'),
        worker: require('./webpack/worker.prod'),
      },
    },
  },
});
