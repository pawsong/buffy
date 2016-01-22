const webpack = require('webpack');
const _ = require('lodash');
const conf = require('@pasta/config');

const defines = {
  'process.env.NODE_ENV': 'production',
  'BUILD_DIR': `${__dirname}/../build/prod`,
};

module.exports = Object.assign({}, require('./server.dev'), {
  output: {
    path: defines.BUILD_DIR,
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
