const webpack = require('webpack');
const _ = require('lodash');

import * as postcss from './postcss';

const babelOptions = JSON.stringify({
  presets: [
    'es2015',
    'react',
  ],
  plugins: [
    'syntax-async-functions',
    'transform-regenerator',
    'syntax-object-rest-spread',
    'transform-object-rest-spread',
  ],
  babelrc: false,
});

module.exports = options => Object.assign(require('./client.dev')(options), {
  entry: options.entry,

  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader!postcss-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: `babel-loader?${babelOptions}!ts-loader` },
    ],
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),

    new webpack.DefinePlugin(_.mapValues(Object.assign({
      'process.env.NODE_ENV': 'production',
      __DEV__: false,
      __CLIENT__: true,
    }, options.defines || {}), val => JSON.stringify(val))),

    new webpack.optimize.UglifyJsPlugin({
      compressor: { warnings: false },
    }),

    ...(options.plugins || []),
  ],

  postcss: webpackInst => postcss.production(webpackInst),

  devtool: options.devtool || 'source-map',
});
