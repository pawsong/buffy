const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/app')({
  prefix: pkg.name.split('/')[1],
  port: conf.authServerPort,
  useBrowserSync: false,
  main: 'build/dev/server',
  webpackConfig: {
    server: {
      dev: require('./webpack/server.dev'),
      prod: require('./webpack/server.prod'),
    },
  },
});
