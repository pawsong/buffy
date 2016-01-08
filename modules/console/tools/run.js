'use strict';
const Promise = require('bluebird');

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
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
  });
}

Promise.all([
  runWebpackDevServer('./webpack/worker.dev', iConfig.consoleWebpackWorkerPort),
  runWebpackDevServer('./webpack/app.dev', iConfig.consoleWebpackAppPort, compiler => {
    // Restart nodemon server when index template file changed.
    let oldTemplate;
    compiler.plugin('done', params => {
      const ofs = compiler.outputFileSystem;
      const f = ofs.readFileSync(compiler.options.output.path + '/index.html').toString();
      if (oldTemplate && oldTemplate !== f) {
        nodemon.restart();
      }
      oldTemplate = f;
    });
  }),
]).then(() => {
  // Run server
  nodemon({
    exec: `(gulp build || exit 1) && node`,
    script: `${__dirname}/../lib/server.js`,
    ext: 'ts tsx',
    watch: [
      '../src/**/*.ts',
    ],
  }).on('log', function (data) {
    if (!data.type || data.type === 'detail') { return; }
    console.log(data.colour);
  });
}).catch(err => {
  console.error(err);
  process.exit(1);
});
