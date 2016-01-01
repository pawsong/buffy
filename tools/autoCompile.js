const spawn = require('child_process').spawn;
const sprintf = require("sprintf-js").sprintf;
const clc = require('cli-color');

// Value is xTerm color code.
// Refer to: https://github.com/medikoo/cli-color
const packages = {
  'config-internal': 11,
  'config-public': 12,
  'game-class': 120,
};

const maxPkgNameLen =
  Math.max.apply(Math, Object.keys(packages).map(pkg => pkg.length)) + '[ ]'.length;

function compileAndWatch(pkg) {
  const color = clc.xterm(packages[pkg]);

  function print(data) {
    const msg = data.toString().trim();
    if (!msg) { return; }
    process.stdout.write(color(sprintf(`%-${maxPkgNameLen}s`, `[${pkg}]`)));
    console.log(msg);
  }

  const child = spawn(__dirname + '/../node_modules/.bin/tsc', ['--watch'], {
    cwd: __dirname + `/../modules/${pkg}`,
  });

  child.stdout.on('data', print);
  child.stderr.on('data', print);
}

Object.keys(packages).forEach(compileAndWatch);
