const conf = require('@pasta/config');
const pkg = require('./package.json');

require('../../gulp/universal')({
  prefix: pkg.name.split('/')[1],
  port: conf.compilerPort,
  useBrowserSync: false,
  main: 'build/dev/server',
  webpackConfig: {
    server: {
      dev: require('./webpack/server.dev'),
      prod: require('./webpack/server.prod'),
    },
  },
});
