const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const _ = require('lodash');
const conf = require('@pasta/config');

const defines = {
  'process.env.NODE_ENV': 'development',
  'CONFIG_GAME_SERVER_URL': `http://localhost:${conf.gameServerPort}`,

  // These configs are referred by addon-voxel-editor.
  // When addon-voxel-editor is compiled by webpack itself,
  // this will be moved to addon-voxel-editor's webpack config file.
  // TODO: Remove
  'CONFIG_API_SERVER_URL': `http://localhost:${conf.addonVoxelEditorServerPort}`,
  'CONFIG_AUTH_SERVER_URL': `http://localhost:${conf.authServerPort}`,
};

module.exports = {
  entry: './src/app.tsx',

  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },

  output: {
    path: `${__dirname}/../build/dev/client/public`,
    filename: 'bundle.js',
    publicPath: '/public',
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: `${__dirname}/../node_modules`,
  },

  plugins: [
    new webpack.DefinePlugin(_.mapValues(defines, val => JSON.stringify(val))),
    new HtmlWebpackPlugin({
      template: `${__dirname}/../src/index.html`, // Load a custom template
      inject: 'body', // Inject all scripts into the body
      filename: '../index.html',
    }),
  ],

  devtool: 'cheap-module-eval-source-map',
};
