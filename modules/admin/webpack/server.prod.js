const webpack = require('webpack');
const fs = require('fs');

module.exports = Object.assign({}, require('./server.dev'), {
  output: {
    path: `${__dirname}/../build/prod`,
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true, entryOnly: false
    }),
  ],
});
