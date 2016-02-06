const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const _ = require('lodash');
const path = require('path');

const babelOptions = JSON.stringify({
  presets: [
    'es2015',
    'react-hmre',
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
  target: options.target || 'web',

  entry: [
    'eventsource-polyfill', // necessary for hot reloading with IE
    `webpack-hot-middleware/client?path=http://localhost:${options.devServerPort}/__webpack_hmr`,
    options.entry,
  ],

  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader!postcss-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts(x?)$/, loader: `babel-loader?${babelOptions}!ts-loader` },
    ],
  },

  output: Object.assign({
    publicPath: `http://localhost:${options.devServerPort}/`,
  }, options.output),

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: path.join(process.cwd(), 'node_modules'),
  },

  plugins: [
    new webpack.DefinePlugin(_.mapValues(Object.assign({
      'process.env.NODE_ENV': 'development',
      __DEV__: false,
    }, options.defines || {}), val => JSON.stringify(val))),

    new webpack.HotModuleReplacementPlugin(),

    ...(options.plugins || []),
  ],

  postcss: function () {
      return [autoprefixer];
  },

  devtool: options.devtool || 'cheap-module-eval-source-map',
});
