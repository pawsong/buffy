require('babel-polyfill');
require('babel-register');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  root: __dirname,
  name: pkg.name.split('/')[1],
  main: './build/dev/server.js',
  port: conf.adminServerPort,
  open: true,
  webpack: {
    client: [{
      name: 'client',
      devServerPort: conf.adminClientPort,
      entry: './src/app.tsx',
      plugins: [
        new HtmlWebpackPlugin({
          template: './src/index.html', // Load a custom template
          inject: 'body', // Inject all scripts into the body
          filename: '../../index.html',
        }),
      ],
      env: {
        development: {
          output: {
            path: `${__dirname}/build/dev/client/public`,
            filename: 'bundle.js',
            publicPath: '/public'
          },
        },
        production: {
          output: {
            path: `${__dirname}/build/prod/client/public`,
            filename: 'bundle.[chunkhash].js',
            publicPath: conf.adminPublicPath,
          },
        },
      },
    }],
    server: [{
      name: 'server',
      entry: './src/server.ts',
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
