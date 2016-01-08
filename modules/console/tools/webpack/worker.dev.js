const webpack = require('webpack');
const iConfig = require('@pasta/config-internal');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = {
  entry: {
    worker: './src/worker.ts',
  },

  target: 'webworker',

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },

  output: {
    path: __dirname + '/build/public',
    filename: 'worker.js',
    publicPath: `http://localhost:${iConfig.consoleWebpackWorkerPort}/`,
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },

  plugins: [
    new ManifestPlugin(),
  ],
}
