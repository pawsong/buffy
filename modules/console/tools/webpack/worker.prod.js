/* eslint no-var: 0 */
var _ = require('lodash');
var iConfig = require('@pasta/config-internal');
var webpackConfigDev = require('./worker.dev');

module.exports = _.defaultsDeep({
  output: {
    path: './build',
    filename: 'worker.[chunkhash].js',
  },
}, webpackConfigDev);
