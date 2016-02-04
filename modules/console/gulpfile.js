require('babel-polyfill');
require('babel-register');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.consolePort,
  useBrowserSync: false,
  webpack: {
    client: [{
      name: 'client',
      devServerPort: conf.addonConsoleClientPort,
      entry: './src/client/app.tsx',
      plugins: [
        new HtmlWebpackPlugin({
          template: './src/index.html', // Load a custom template
          inject: 'body', // Inject all scripts into the body
          filename: '../../index.html',
        }),
      ],
      env: {
        development: {
          defines: {
            'CONFIG_GAME_SERVER_URL': `http://localhost:${conf.gameServerPort}`,

            // These configs are referred by addon-voxel-editor.
            // When addon-voxel-editor is compiled by webpack itself,
            // this will be moved to addon-voxel-editor's webpack config file.
            // TODO: Remove
            'CONFIG_API_SERVER_URL': `http://localhost:${conf.addonVoxelEditorServerPort}`,
            'CONFIG_AUTH_SERVER_URL': `http://localhost:${conf.authServerPort}`,
          },
          output: {
            path: `${__dirname}/build/dev/client/public`,
            filename: 'bundle.js',
          },
        },
        production: {
          output: {
            path: `${__dirname}/build/prod/client/public`,
            filename: 'bundle.[chunkhash].js',
            publicPath: conf.consolePublicPath,
          },
        },
      },
    }],
    server: [{
      name: 'server',
      entry: './src/server/server.ts',
      env: {
        development: {
          defines: {
            'CONFIG_DOMAIN': '',
            'CONFIG_GAME_SERVER_URL': `http://localhost:${conf.gameServerPort}`,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdDev,
            'CONFIG_AUTH_SERVER_URL': `http://localhost:${conf.authServerPort}`,
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          defines: {
            'process.env.NODE_ENV': 'production',
            'CONFIG_DOMAIN': conf.domain,
            'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdProd,
            'CONFIG_AUTH_SERVER_URL': conf.authServerUrl,
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
