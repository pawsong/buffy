const iconfig = require('@pasta/config-internal');

require('../../gulp/universal')({
  prefix: 'admin',
  port: iconfig.adminServerPort,
  devPort: iconfig.adminServerDevPort,
  main: 'build/dev/server.js',
  webpackConfig: {
    server: {
      dev: require('./webpack/server.dev'),
      prod: require('./webpack/server.prod'),
    },
    client: {
      dev: {
        app: require('./webpack/app.dev'),
      },
      prod: {
        app: require('./webpack/app.prod'),
      },
    },
  },
});
