module.exports = Object.assign({}, require('./worker.dev'), {
  output: {
    path: `${__dirname}/../build/prod/client/public`,
    filename: 'worker.[chunkhash].js',
  },
});
