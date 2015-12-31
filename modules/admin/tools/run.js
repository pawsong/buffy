'use strict';

const Promise = require('bluebird');

const fs = require('fs');
const nodemon = require('nodemon');

// Run server
nodemon({
  // babel-node does not work well with nodemon,
  // so use wrapper with babel-core/register.
  cwd: __dirname,
  exec: '(../../../node_modules/.bin/tsc || exit 1) && node',
  script: '../lib/server.js',
  ext: 'ts',
  watch: [
    '../src/**/*.ts',
  ],
}).on('log', function (data) {
  if (!data.type || data.type === 'detail') { return; }
  console.log(data.colour);
});
