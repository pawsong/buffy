const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const _ = require('lodash');
const conf = require('@pasta/config');

const defines = {
  'process.env.NODE_ENV': 'production',
  'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,

  // These configs are referred by addon-voxel-editor.
  // When addon-voxel-editor is compiled by webpack itself,
  // this will be moved to addon-voxel-editor's webpack config file.
  // TODO: Remove
  'CONFIG_API_SERVER_URL': conf.addonVoxelEditorServerUrl,
  'CONFIG_AUTH_SERVER_URL': conf.authServerUrl,
};

module.exports = Object.assign({}, require('./app.dev'), {
  output: {
    path: `${__dirname}/../build/prod/client/public`,
    filename: 'bundle.[chunkhash].js',
    publicPath: conf.consolePublicPath,
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),

    new webpack.DefinePlugin(_.mapValues(defines, val => JSON.stringify(val))),

    // Should be enabled when officially released
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    }),

    new HtmlWebpackPlugin({
      template: __dirname + '/../src/index.html', // Load a custom template
      inject: 'body', // Inject all scripts into the body
      filename: '../index.html',
    }),
  ],

  devtool: 'hidden-source-map',
});
