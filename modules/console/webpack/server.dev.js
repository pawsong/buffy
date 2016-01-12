const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  target: 'node',
  entry: './src/server.tsx',
  output: {
    path: `${__dirname}/../build/dev`,
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
    ],
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: `${__dirname}/../node_modules`,
  },
  externals: function filter(context, request, cb) {
    const isExternal =
      request.match(/^[@a-z][a-z\/\.\-0-9]*$/i);
      cb(null, Boolean(isExternal));
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false
    }),
  ],
  node: {
    __dirname: false,
  },
  devtool: 'source-map',
};
