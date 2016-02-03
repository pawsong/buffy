'use strict'; // eslint-disable-line

const conf = require('@pasta/config');

require('../../gulp/app')({
  prefix: 'admin',
  port: conf.adminServerPort,
  devPort: conf.adminServerDevPort,
  main: 'build/dev/server.js',
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
