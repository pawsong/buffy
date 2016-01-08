const Childminder = require('childminder').Childminder;
const spawn = require('child_process').spawn;
const sprintf = require("sprintf-js").sprintf;
const clc = require('cli-color');

const cm = new Childminder();

// Value is xTerm color code.
// Refer to: https://github.com/medikoo/cli-color
const packages = {
  'config-internal': 11,
  'config-public': 12,
  'game-class': 120,
  'game-api': 159,
  'helper-public': 202,
  'helper-internal': 163,
  'mongodb': 231,
  'voxel-editor': 25,
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
