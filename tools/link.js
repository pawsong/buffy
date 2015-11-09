const fs = require('fs');
const exec = require('child_process').execSync;

const cwd = process.cwd();

const pkg = require(`${cwd}/package.json`);
if (!pkg.link) {
  return;
}

pkg.link.forEach(path => {
  exec(`npm link ${path}`, { cwd });
});
