'use strict'; // eslint-disable-line

const conf = require('@pasta/config');

require('../../gulp/app')({
  prefix: 'console',
  port: conf.consolePort,
  devPort: conf.consoleDevPort,
  main: 'build/dev/server',
  webpackConfig: {
    server: {
      dev: require('./webpack/server.dev'),
      prod: require('./webpack/server.prod'),
    },
    client: {
      dev: {
        app: require('./webpack/app.dev'),
      },
      prod: {
        app: require('./webpack/app.prod'),
      },
    },
  },
});
