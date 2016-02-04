require('babel-polyfill');
require('babel-register');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.addonVoxelEditorServerPort,
  webpack: {
    client: [{
      name: 'client',
      devServerPort: conf.addonVoxelEditorClientPort,
      entry: './src/client/index.ts',
      defines: {
        'NPM_PACKAGE_NAME': pkg.name,
      },
      env: {
        development: {
          defines: {
            'process.env.NODE_ENV': 'development',
            'NPM_PACKAGE_NAME': pkg.name,
            'CONFIG_API_SERVER_URL': `http://localhost:${conf.addonVoxelEditorServerPort}`,
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'client.js',
          },
        },
        production: {
          defines: {
            'process.env.NODE_ENV': 'production',
            'NPM_PACKAGE_NAME': pkg.name,
            'CONFIG_API_SERVER_URL': conf.addonVoxelEditorServerUrl,
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
