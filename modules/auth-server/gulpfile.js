require('babel-polyfill');
require('babel-register');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.authServerPort,
  webpack: {
    server: [{
      name: 'server',
      entry: './src/server.ts',
      defines: {
        'NPM_PACKAGE_NAME': pkg.name,
      },
      env: {
        development: {
          defines: {
            'BUILD_DIR': `${__dirname}/../build/dev`,
            '__DOMAIN__': '',
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          defines: {
            'BUILD_DIR': `${__dirname}/../build/prod`,
            '__DOMAIN__': conf.domain,
          },
          output: {
            path: `${__dirname}/build/prod`,
            filename: 'server.js',
          },
        },
      },
    }],
  },
});
