/* eslint no-var: 0 */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('@pasta/config-public');
const path = require('path');

module.exports = {
  entry: './src/app.ts',

  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
    ],
  },

  output: {
    path: '/',
    filename: 'bundle.js',
    publicPath: config.adminPublicPath,
  },

  resolve: {
    extensions: ['', '.js'],
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
