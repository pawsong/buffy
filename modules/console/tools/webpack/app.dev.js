/* eslint no-var: 0 */
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var config = require('@pasta/config');

module.exports = {
  entry: './src/app.js',

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
    ],
  },

  output: {
    path: __dirname + '/build/public',
    filename: 'bundle.js',
    publicPath: `http://localhost:${config.consoleWebpackAppPort}/`,
  },

  resolve: {
    extensions: ['', '.js'],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      }
    }),
    new HtmlWebpackPlugin({
      template: __dirname + '/../../src/index.html', // Load a custom template
      inject: 'body', // Inject all scripts into the body
      filename: 'index.html',
    }),
  ],

  devtool: 'cheap-module-eval-source-map',
}
