const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const conf = require('@pasta/config-public/lib/production').default;

module.exports = Object.assign({}, require('./app.dev'), {
  output: {
    path: `${__dirname}/../build/prod/client/public`,
    filename: 'bundle.[chunkhash].js',
    publicPath: conf.adminPublicPath,
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
