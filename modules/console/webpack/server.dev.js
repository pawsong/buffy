const webpack = require('webpack');
const fs = require('fs');
const _ = require('lodash');
const conf = require('@pasta/config');

const defines = {
  'process.env.NODE_ENV': 'development',
  'CONFIG_DOMAIN': '',
  'CONFIG_GAME_SERVER_URL': `http://localhost:${conf.gameServerPort}`,
  'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdDev,
};

module.exports = {
  target: 'node',
  entry: './src/server.tsx',
  output: {
    path: `${__dirname}/../build/dev`,
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: `${__dirname}/../node_modules`,
  },
  externals: function filter(context, request, cb) {
    const isExternal =
      request.match(/^[@a-z][a-z\/\.\-0-9]*$/i);
      cb(null, Boolean(isExternal));
  },
  plugins: [
    new webpack.DefinePlugin(_.mapValues(defines, val => JSON.stringify(val))),
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false
    }),
  ],
  node: {
    __dirname: false,
  },
  devtool: 'source-map',
};
