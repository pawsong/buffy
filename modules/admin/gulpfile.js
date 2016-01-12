const iconfig = require('@pasta/config-internal');

require('../../gulp/universal')({
  port: iconfig.adminServerPort,
  devPort: iconfig.adminServerDevPort,
  webpackConfig: {
    server: require('./webpack/server'),
    dev: {
      app: require('./webpack/app.dev'),
    },
    prod: {
      app: require('./webpack/app.prod'),
    }
  },
});
