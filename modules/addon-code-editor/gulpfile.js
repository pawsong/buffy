'use strict'; // eslint-disable-line

const conf = require('@pasta/config');

require('../../gulp/universal')({
  prefix: 'addon-code-editor',
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
        worker: require('./webpack/worker.dev'),
      },
      prod: {
        client: require('./webpack/client.prod'),
        worker: require('./webpack/worker.prod'),
      },
    },
  },
});
