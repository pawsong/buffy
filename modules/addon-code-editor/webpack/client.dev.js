const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const _ = require('lodash');
const pkg = require('../package.json');

const defines = {
  'process.env.NODE_ENV': 'development',
  'NPM_PACKAGE_NAME': pkg.name,
};

module.exports = {
  target: 'web',

  entry: './src/client/index.ts',

  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader!postcss-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },

  output: {
    path: `${__dirname}/../build/dev`,
    filename: 'client.js',
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },

  plugins: [
    new webpack.DefinePlugin(_.mapValues(defines, val => JSON.stringify(val))),
  ],

  postcss: function () {
      return [autoprefixer];
  },

  devtool: 'cheap-module-eval-source-map',
}
