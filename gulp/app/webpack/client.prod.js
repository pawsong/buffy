const webpack = require('webpack');
const _ = require('lodash');

module.exports = options => Object.assign(require('./client.dev')(options), {
  entry: options.entry,

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),

    new webpack.DefinePlugin(_.mapValues(Object.assign({
      'process.env.NODE_ENV': 'production',
      __DEV__: false,
    }, options.defines || {}), val => JSON.stringify(val))),

    new webpack.optimize.UglifyJsPlugin({
      compressor: { warnings: false },
    }),

    ...(options.plugins || []),
  ],

  devtool: options.devtool || 'source-map',
});
