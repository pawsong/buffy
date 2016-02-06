require('babel-polyfill');
require('babel-register');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.addonGameServerPort,
  webpack: {
    client: [{
      name: 'client',
      devServerPort: conf.addonGameClientPort,
      entry: './src/client/index.ts',
      env: {
        development: {
          defines: {
            'NPM_PACKAGE_NAME': pkg.name,
            'CONFIG_GAME_SERVER_URL': `http://localhost:${conf.gameServerPort}`,
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'client.js',
          },
        },
        production: {
          defines: {
            'NPM_PACKAGE_NAME': pkg.name,
            'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,
          },
          output: {
            path: `${__dirname}/build/prod`,
            filename: 'client.js',
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
