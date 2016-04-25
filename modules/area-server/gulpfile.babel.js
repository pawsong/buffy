require('babel-polyfill');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.gameServerPort,
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
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          defines: {
            'BUILD_DIR': `${__dirname}/../build/prod`,
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
