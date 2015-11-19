const fs = require('fs');
const path = require('path');
const exec = require('child_process').execSync;

const cwd = process.cwd();

const pkg = require(`${cwd}/package.json`);
if (!pkg.link) {
  return;
}

pkg.link.forEach(linkPath => {
  // Check if package is already installed (for fast link)
  const linkPkg = require(path.join(cwd, linkPath, 'package.json'));
  if (fs.existsSync(path.join(cwd, 'node_modules', linkPkg.name))) {
    return;
  }

  exec(`npm link ${linkPath}`, { cwd });
});
