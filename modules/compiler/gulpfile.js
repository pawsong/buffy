const pkg = require('./package.json');

require('../../gulp/server')({
  prefix: pkg.name.split('/')[1],
});
