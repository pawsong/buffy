/* eslint no-var: 0 */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('@pasta/config-public');
const path = require('path');

module.exports = {
  entry: './src/app.tsx',

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },

  output: {
    path: '/',
    filename: 'bundle.js',
    publicPath: config.consolePublicPath,
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: path.join(__dirname, '/../../node_modules'),
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + '/../../src/index.html', // Load a custom template
      inject: 'body', // Inject all scripts into the body
      filename: 'index.html',
    }),
  ],

  devtool: 'cheap-module-eval-source-map',
}
