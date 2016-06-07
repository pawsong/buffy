const webpack = require('webpack');
const fs = require('fs');
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

const localIp = require('ip').address();

module.exports = options => ({
  target: 'node',
  entry: options.entry,
  output: Object.assign({
    publicPath: `http://${localIp}:${options.devServerPort}/`,
    libraryTarget: 'commonjs2',
  }, options.output),
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: `babel-loader?${babelOptions}!ts-loader` },
      {
        test: /\.css$/,
        loaders: [
          'isomorphic-style-loader',
          'css-loader?modules&localIdentName=[name]_[local]_[hash:base64:3]',
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  externals: function filter(context, request, cb) {
    const isExternal =
      request.match(/^[@a-z][a-z\/\.\-0-9]*$/i);
      cb(null, Boolean(isExternal));
  },
  plugins: [
    new webpack.DefinePlugin(_.mapValues(Object.assign({
      'process.env.NODE_ENV': 'development',
      __DEV__: true,
      __CLIENT__: false,
    }, options.defines || {}), val => JSON.stringify(val))),

    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false,
    }),

    ...(options.plugins || []),
  ],
  node: {
    __dirname: false,
  },

  postcss: webpackInst => postcss.development(webpackInst),

  devtool: 'source-map',
});
