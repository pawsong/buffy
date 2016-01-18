module.exports = Object.assign({}, require('./worker.dev'), {
  output: {
    path: `${__dirname}/../build/prod`,
    filename: 'worker.js',
  },
});
