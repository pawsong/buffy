const webpack = require('webpack');
const _ = require('lodash');

import * as postcss from './postcss';

module.exports = options => Object.assign(require('./server.dev')(options), {
  plugins: [
    new webpack.DefinePlugin(_.mapValues(Object.assign({
      'process.env.NODE_ENV': 'production',
      __DEV__: false,
      __CLIENT__: false,
    }, options.defines || {}), val => JSON.stringify(val))),

    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false
    }),

    ...(options.plugins || []),
  ],

  postcss: webpackInst => postcss.production(webpackInst),
});
