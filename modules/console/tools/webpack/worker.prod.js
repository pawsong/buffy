/* eslint no-var: 0 */
var _ = require('lodash');
var iConfig = require('@pasta/config-internal');
var webpackConfigDev = require('./worker.dev');

module.exports = _.defaultsDeep({
  output: {
    path: './build/public',
    filename: 'worker.js',
    publicPath: 'http://localhost:${iConfig.consoleWebpackWorkerPort}',
  },
}, webpackConfigDev);
