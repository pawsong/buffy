const pkg = require('./package.json');

require('../../gulp/lib')({
  prefix: pkg.name.split('/')[1],
});
