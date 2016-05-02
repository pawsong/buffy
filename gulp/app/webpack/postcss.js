const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

export const development = webpack => [
  require('postcss-import')({ addDependencyTo: webpack }),
  require('postcss-cssnext')(),
];

export const production = webpack => development(webpack).concat([
  cssnano(),
]);
