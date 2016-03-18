// Monkey patch babel interop function to make it equals to that of typescript
const template = require('babel-template');
require('babel-helpers/lib/helpers').interopRequireWildcard = template(`
  (function (obj) {
    if (obj && (obj.__esModule || typeof obj === 'function')) {
      return obj;
    } else {
      var newObj = {};
      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }
      newObj.default = obj;
      return newObj;
    }
  })
`);

require('babel-polyfill');
require('babel-register');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const conf = require('@pasta/config');

const updateLocaleData = require('./scripts/updateLocaleData').default;
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
      entry: './src/client.tsx',
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
            'CONFIG_API_SERVER_URL': `http://localhost:${conf.apiServerPort}`,
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
            'CONFIG_API_SERVER_URL': conf.apiServerUrl,
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
      postCompile(done) {
        try {
          updateLocaleData();
          done();
        } catch(error) {
          done(error);
        }
      },
    }],
    server: [{
      name: 'server',
      devServerPort: conf.addonConsoleClientPort, // For server rendering
      entry: './src/server.tsx',
      env: {
        development: {
          defines: {
            'CONFIG_DOMAIN': '',
            'CONFIG_API_SERVER_URL': `http://localhost:${conf.apiServerPort}`,
            'CONFIG_AUTH_SERVER_URL': `http://localhost:${conf.authServerPort}`,
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          defines: {
            'CONFIG_DOMAIN': conf.domain,
            'CONFIG_API_SERVER_URL': conf.apiServerUrl,
            'CONFIG_AUTH_SERVER_URL': conf.authServerUrl,
          },
          output: {
            path: `${__dirname}/build/prod`,
            filename: 'server.js',
            publicPath: `${conf.consolePublicPath}/`,
          },
        },
      },
    }],
  },
});
