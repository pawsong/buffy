'use strict'; // eslint-disable-line

// Fix TypeScript - Babel interop rule conflict problem.
// Remove this as soon as this issue is resolved:
// https://github.com/TypeStrong/ts-loader/issues/111
require('babel-helpers/lib/helpers').interopRequireDefault =
require('babel-helpers/lib/helpers').interopRequireWildcard =
  require('babel-template')('(function (obj) { return obj; })');

const conf = require('@pasta/config');

require('../../gulp/universal')({
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
        worker: require('./webpack/worker.dev'),
      },
      prod: {
        app: require('./webpack/app.prod'),
        worker: require('./webpack/worker.prod'),
      },
    },
  },
});
