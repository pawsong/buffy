'use strict'; // eslint-disable-line

const conf = require('@pasta/config');

require('../../gulp/universal')({
  prefix: 'addon-game',
  port: conf.addonCodeEditorServerPort,
  useBrowserSync: false,
  main: 'build/dev/server',
  webpackConfig: {
    server: {
      dev: require('./webpack/server.dev'),
      prod: require('./webpack/server.prod'),
    },
    client: {
      dev: {
        client: require('./webpack/client.dev'),
      },
      prod: {
        client: require('./webpack/client.prod'),
      },
    },
  },
});
