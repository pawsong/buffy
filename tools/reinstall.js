const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const exec = require('child_process').execSync;

const root = path.resolve(__dirname, '..');

const pkg = require(path.resolve(root, 'package.json'));

function existsSync(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch(err) {
    return false;
  }
}

pkg.deployables.forEach(deployable => {
  const modulePath = path.resolve(root, 'modules', deployable);
  if (!existsSync(modulePath)) { return; }
  rimraf.sync(path.resolve(modulePath, 'node_modules', '\@pasta'));
  exec('npm install --production', { cwd: modulePath });
});
