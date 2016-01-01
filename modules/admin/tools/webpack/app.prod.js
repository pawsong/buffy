// Before config load
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const _ = require('lodash');
const config = require('@pasta/config-public');
const webpackConfigDev = require('./app.dev');

module.exports = _.defaultsDeep({
  output: {
    path: './build/public',
    filename: 'bundle.[chunkhash].js',
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),

    // Should be enabled when officially released
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ].concat(webpackConfigDev.plugins),

  devtool: 'hidden-source-map',
}, webpackConfigDev);
