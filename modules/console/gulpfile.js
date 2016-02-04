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
  open: true,
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
            'CONFIG_AUTH_SERVER_URL': `http://localhost:${conf.authServerPort}`,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdDev,
          },
          output: {
            path: `${__dirname}/build/dev/client/public`,
            filename: 'bundle.js',
          },
        },
        production: {
          defines: {
            'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,
            'CONFIG_AUTH_SERVER_URL': conf.authServerUrl,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdProd,
          },
          output: {
            path: `${__dirname}/build/prod/client/public`,
            filename: 'bundle.[chunkhash].js',
            publicPath: `${conf.consolePublicPath}/`,
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
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          defines: {
            'CONFIG_DOMAIN': conf.domain,
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
