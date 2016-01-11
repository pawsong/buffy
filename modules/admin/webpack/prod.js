const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('@pasta/config-public/lib/production');

module.exports = Object.assign({}, require('./dev'), {
  output: {
    path: './build/prod/public',
    filename: 'bundle.[chunkhash].js',
    publicPath: config.adminPublicPath,
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),

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
