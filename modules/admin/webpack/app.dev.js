const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/app.ts',

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },

  output: {
    path: './build/dev/client/public',
    filename: 'bundle.js',
    publicPath: '/public',
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: `${__dirname}/../node_modules`,
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new HtmlWebpackPlugin({
      template: `${__dirname}/../src/index.html`, // Load a custom template
      inject: 'body', // Inject all scripts into the body
      filename: '../index.html',
    }),
  ],

  devtool: 'cheap-module-eval-source-map',
};