/* eslint no-var: 0 */
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var config = require('@pasta/config-public');
const path = require('path');

module.exports = {
  entry: './src/app.js',

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
    ],
  },

  output: {
    path: '/',
    filename: 'bundle.js',
    publicPath: config.consolePublicPath,
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
