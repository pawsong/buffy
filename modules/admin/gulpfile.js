'use strict'; // eslint-disable-line

// Fix TypeScript - Babel interop rule conflict problem.
// Remove this as soon as this issue is resolved:
// https://github.com/TypeStrong/ts-loader/issues/111
require('babel-helpers/lib/helpers').interopRequireDefault =
require('babel-helpers/lib/helpers').interopRequireWildcard =
  require('babel-template')('(function (obj) { return obj; })');

const conf = require('@pasta/config');

require('../../gulp/universal')({
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
