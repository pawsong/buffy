const path = require('path');
const express = require('express');
const cors = require('cors');

module.exports = (compiler, port) => {
  const app = express();

  app.use(cors());

  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: compiler.options.output.publicPath,
  }));

  app.use(require('webpack-hot-middleware')(compiler));

  return new Promise((resolve, reject) => {
    app.listen(port, 'localhost', err => err ? reject(err) : resolve());
  });
};
