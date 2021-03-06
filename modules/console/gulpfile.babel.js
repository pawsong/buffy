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

const localIp = require('ip').address();

const del = require('del');

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
  hooks: {
    'serve:dev:start': () => del.sync(`${__dirname}/build/**`),
  },
  webpack: {
    client: [{
      name: 'client',
      devServerPort: conf.addonConsoleClientPort,
      entry: './src/client.tsx',
      plugins: [
        new HtmlWebpackPlugin({
          template: './src/index.html', // Load a custom template
          filename: '../../index.html',
        }),
      ],
      env: {
        development: {
          defines: {
            'CONFIG_GAME_SERVER_URL': `http://${localIp}:${conf.gameServerPort}`,
            'CONFIG_API_SERVER_URL': `http://${localIp}:${conf.apiServerPort}`,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdDev,
            '__BASE__': `http://${localIp}:${conf.consolePort}`,
            '__S3_BASE__': conf.s3PublicPathDev,
            '__CDN_BASE__': conf.cdnPublicPathDev,
            '__GA_TRACKING_ID__': 'UA-79780752-2',
          },
          output: {
            path: `${__dirname}/build/dev/client/public`,
            filename: 'bundle.js',
          },
          devtool: 'cheap-module-source-map',
        },
        production: {
          defines: {
            'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,
            'CONFIG_API_SERVER_URL': conf.apiServerUrl,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdProd,
            '__BASE__': `https://buffy.run`,
            '__S3_BASE__': conf.s3PublicPathProd,
            '__CDN_BASE__': conf.cdnPublicPathProd,
            '__GA_TRACKING_ID__': 'UA-79780752-1',
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
            'CONFIG_GAME_SERVER_URL': `http://${localIp}:${conf.gameServerPort}`,
            'CONFIG_API_SERVER_URL': `http://${localIp}:${conf.apiServerPort}`,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdDev,
            '__BASE__': `http://${localIp}:${conf.consolePort}`,
            '__S3_BASE__': conf.s3PublicPathDev,
            '__CDN_BASE__': conf.cdnPublicPathDev,
          },
          output: {
            path: `${__dirname}/build/dev`,
            filename: 'server.js',
          },
        },
        production: {
          defines: {
            'CONFIG_DOMAIN': conf.domain,
            'CONFIG_GAME_SERVER_URL': conf.gameServerUrl,
            'CONFIG_API_SERVER_URL': conf.apiServerUrl,
            'CONFIG_FACEBOOK_APP_ID': conf.facebookAppIdProd,
            '__BASE__': `https://buffy.run`,
            '__S3_BASE__': conf.s3PublicPathProd,
            '__CDN_BASE__': conf.cdnPublicPathProd,
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
