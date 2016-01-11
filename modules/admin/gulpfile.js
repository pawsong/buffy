const iconfig = require('@pasta/config-internal');

require('../../gulp/universal')({
  port: iconfig.adminServerPort,
  devPort: iconfig.adminServerDevPort,
  webpackConfig: {
    dev: require('./webpack/dev'),
    prod: require('./webpack/prod'),
  },
});
