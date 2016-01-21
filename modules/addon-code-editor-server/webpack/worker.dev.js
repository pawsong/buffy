const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = {
  target: 'webworker',

  entry: {
    worker: './src/worker/worker.ts',
  },

  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },

  output: {
    path: `${__dirname}/../build/dev`,
    filename: 'worker.js',
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },

  plugins: [
    new ManifestPlugin(),
  ],

  devtool: 'cheap-module-eval-source-map',
}
