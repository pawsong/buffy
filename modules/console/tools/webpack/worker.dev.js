/* eslint no-var: 0 */
const webpack = require('webpack');
const config = require('@pasta/config');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = {
  entry: {
    worker: './src/worker.js',
  },

  target: 'webworker',

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
    ],
  },

  output: {
    path: __dirname + '/build/public',
    filename: 'worker.js',
    publicPath: `http://localhost:${config.consoleWebpackWorkerPort}/`,
  },

  resolve: {
    extensions: ['', '.js'],
  },

  plugins: [
    new ManifestPlugin(),
  ],
}
