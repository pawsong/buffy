const iconfig = require('@pasta/config-internal');

require('../../gulp/universal')({
  port: iconfig.adminServerPort,
  devPort: iconfig.adminServerDevPort,
  webpackConfig: {
    server: require('./webpack/server'),
    appDev: require('./webpack/app.dev'),
    appProd: require('./webpack/app.prod'),
  },
});
