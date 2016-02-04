const webpack = require('webpack');
const fs = require('fs');
const _ = require('lodash');

const babelOptions = JSON.stringify({
  presets: [
    'es2015',
  ],
  plugins: [
    'syntax-async-functions',
    'transform-regenerator',
    'syntax-object-rest-spread',
    'transform-object-rest-spread',
  ],
  babelrc: false,
});

module.exports = options => ({
  target: 'node',
  entry: options.entry,
  output: {
    path: options.output.path,
    filename: options.output.filename,
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: `babel-loader?${babelOptions}!ts-loader` },
    ],
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  externals: function filter(context, request, cb) {
    const isExternal =
      request.match(/^[@a-z][a-z\/\.\-0-9]*$/i);
      cb(null, Boolean(isExternal));
  },
  plugins: [
    new webpack.DefinePlugin(_.mapValues(Object.assign({
      'process.env.NODE_ENV': 'development',
      __DEV__: true,
    }, options.defines || {}), val => JSON.stringify(val))),

    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false,
    }),

    ...(options.plugins || []),
  ],
  node: {
    __dirname: false,
  },
  devtool: 'source-map',
});
