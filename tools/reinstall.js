const path = require('path');
const rimraf = require('rimraf');
const exec = require('child_process').execSync;

const root = path.resolve(__dirname, '..');

const pkg = require(path.resolve(root, 'package.json'));

pkg.deployables.forEach(deployable => {
  const modulePath = path.resolve(root, 'modules', deployable);
  rimraf.sync(path.resolve(modulePath, 'node_modules', '\@pasta'));
  exec('npm install --production', {
    cwd: modulePath,
  });
});
