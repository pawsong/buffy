const webpack = require('webpack');
const iConfig = require('@pasta/config-internal');
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
    publicPath: `http://localhost:${iConfig.consoleWebpackWorkerPort}/`,
  },

  resolve: {
    extensions: ['', '.js'],
  },

  plugins: [
    new ManifestPlugin(),
  ],
}
