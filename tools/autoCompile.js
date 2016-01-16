const Childminder = require('childminder').Childminder;
const spawn = require('child_process').spawn;
const sprintf = require("sprintf-js").sprintf;
const clc = require('cli-color');

const cm = new Childminder();

// Value is xTerm color code.
// Refer to: https://github.com/medikoo/cli-color
const packages = {
  'config': 11,
  'config-public': 12,
  'game-class': 120,
  'game-api': 159,
  'helper': 202,
  'mongodb': 231,
  'addon-voxel-editor': 25,
};

const maxPkgNameLen =
  Math.max.apply(Math, Object.keys(packages).map(pkg => pkg.length)) + '[ ]'.length;

function compileAndWatch(pkg) {
  cm.create('npm', ['run', 'test:watch'], {
    cwd: __dirname + `/../modules/${pkg}`,
    prefix: pkg,
    prefixColor: packages[pkg],
  });
}

Object.keys(packages).forEach(compileAndWatch);
