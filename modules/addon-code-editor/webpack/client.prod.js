const webpack = require('webpack');
const _ = require('lodash');
const pkg = require('../package.json');

const defines = {
  'process.env.NODE_ENV': 'production',
  'NPM_PACKAGE_NAME': pkg.name,
};

module.exports = Object.assign({}, require('./client.dev'), {
  output: {
    path: `${__dirname}/../build/prod`,
    filename: 'client.js',
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),

    new webpack.DefinePlugin(_.mapValues(defines, val => JSON.stringify(val))),

    // Should be enabled when officially released
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    }),
  ],

  devtool: false,
});
