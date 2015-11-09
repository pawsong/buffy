module.exports = {
  target: 'node',

  entry: './server.js',

  output: {
    libraryTarget: "commonjs2",
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },

  externals: [
    // Ignore packages in node_modules
    /^[a-z\/\-0-9]+$/i,
  ],

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader' },
    ],
  },
};
