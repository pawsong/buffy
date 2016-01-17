const webpack = require('webpack');
const _ = require('lodash');
const conf = require('@pasta/config');

const defines = {
  'process.env.NODE_ENV': 'production',
  'CONFIG_DOMAIN': conf.domain,
  'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,
  'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdProd,
  'CONFIG_AUTH_SERVER_URL': conf.authServerUrl,
};

module.exports = Object.assign({}, require('./server.dev'), {
  output: {
    path: `${__dirname}/../build/prod`,
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  plugins: [
    new webpack.DefinePlugin(_.mapValues(defines, val => JSON.stringify(val))),
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false
    }),
  ],
});
