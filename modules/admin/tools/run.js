'use strict';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const Promise = require('bluebird');

const fs = require('fs');
const nodemon = require('nodemon');

const iConfig = require('@pasta/config-internal');

function runWebpackDevServer(configPath, port, plugin) {
  return new Promise((resolve, reject) => {
    const webpackConfig = require(configPath);
    webpackConfig.cwd = __dirname;
    const compiler = webpack(webpackConfig);

    if (plugin) {
      plugin(compiler);
    }

    const server = new WebpackDevServer(compiler, {
      stats: { colors: true },
    });
    server.listen(port, err => err ? reject(err) : resolve());
  }).then(() => {
    console.log(`Webpack server listening at ${port}`);
  });
}

runWebpackDevServer('./webpack/app.dev', iConfig.adminWebpackAppPort);

// Run server
nodemon({
  // babel-node does not work well with nodemon,
  // so use wrapper with babel-core/register.
  cwd: __dirname,
  exec: '(../../../node_modules/.bin/tsc || exit 1) && node',
  script: '../lib/server.js',
  ext: 'ts',
  watch: [
    '../src/**/*.ts',
  ],
}).on('log', function (data) {
  if (!data.type || data.type === 'detail') { return; }
  console.log(data.colour);
});

