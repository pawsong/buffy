const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

export const development = [autoprefixer];

export const production = development.concat([
  cssnano()
]);
