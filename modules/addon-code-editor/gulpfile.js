require('babel-polyfill');
require('babel-register');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.addonCodeEditorServerPort,
  webpack: {
    client: [{
      name: 'client',
      devServerPort: conf.addonCodeEditorClientPort,
      entry: './src/client/index.ts',
      defines: {
        'NPM_PACKAGE_NAME': pkg.name,
      },
      env: {
        development: {
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'client.js',
          },
        },
        production: {
          output: {
            path: `${__dirname}/build/prod`,
            filename: 'client.js',
          },
        },
      },
    }, {
      name: 'worker',
      target: 'webworker',
      devServerPort: conf.addonCodeEditorWorkerPort,
      entry: './src/worker/worker.ts',
      defines: {
        'window': undefined, // eventsource-polyfill
        'window.XDomainRequest': undefined, // eventsource-polyfill
      },
      devtool: 'inline-source-map',
      env: {
        development: {
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'worker.js',
          },
        },
        production: {
          output: {
            path: `${__dirname}/build/prod`,
            filename: 'worker.js',
          },
        },
      },
    }],
    server: [{
      name: 'server',
      entry: './src/server/server.ts',
      defines: {
        'NPM_PACKAGE_NAME': pkg.name,
      },
      env: {
        development: {
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          output: {
            path: `${__dirname}/build/prod`,
            filename: 'server.js',
          },
        },
      },
    }],
  },
});
