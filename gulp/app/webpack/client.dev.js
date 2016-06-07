const webpack = require('webpack');
const _ = require('lodash');
const path = require('path');

import * as postcss from './postcss';

const localIp = require('ip').address();

module.exports = options => {
  const babelOptions = JSON.stringify({
    presets: [
      'es2015',
      'react',
      'react-hmre',
    ],
    plugins: [
      'syntax-async-functions',
      'transform-regenerator',
      'syntax-object-rest-spread',
      'transform-object-rest-spread',
      ['react-intl', {
        messagesDir: `${options.output.path}/../messages/`,
        enforceDescriptions: true,
      }],
    ],
    babelrc: false,
  });

  return {
    target: options.target || 'web',

    entry: [
      'eventsource-polyfill', // necessary for hot reloading with IE
      `webpack-hot-middleware/client?path=http://${localIp}:${options.devServerPort}/__webpack_hmr`,
      options.entry,
    ],

    module: {
      preLoaders: [
        { test: /\.js$/, loader: 'source-map-loader' },
      ],
      loaders: [
        {
          test: /\.css$/,
          loaders: [
            'isomorphic-style-loader',
            'css-loader?modules&localIdentName=[name]_[local]_[hash:base64:3]',
            'postcss-loader',
          ],
        },
        { test: /\.json$/, loader: 'json-loader' },
        { test: /\.ts(x?)$/, loader: `babel-loader?${babelOptions}!ts-loader` },
      ],
    },

    output: Object.assign({
      publicPath: `http://${localIp}:${options.devServerPort}/`,
    }, options.output),

    resolve: {
      extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
      fallback: path.join(process.cwd(), 'node_modules'),
    },

    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),

      new webpack.DefinePlugin(_.mapValues(Object.assign({
        'process.env.NODE_ENV': 'development',
        __DEV__: true,
        __CLIENT__: true,
      }, options.defines || {}), val => JSON.stringify(val))),

      new webpack.HotModuleReplacementPlugin(),

      ...(options.plugins || []),
    ],

    postcss: webpackInst => postcss.development(webpackInst),

    devtool: options.devtool || 'cheap-module-eval-source-map',
  };
};
