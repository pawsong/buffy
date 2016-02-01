const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = {
  target: 'webworker',

  entry: './src/worker/worker.ts',

  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
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

  devtool: 'inline-source-map',
}
