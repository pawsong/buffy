const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const pkgDir = require('pkg-dir');
const _ = require('lodash');
const exec = require('child_process').execSync;

// Untar command
const untar = path.resolve(__dirname, '../node_modules/.bin/targz');

const pkgDirPath = pkgDir.sync(process.cwd());
const bundlePath = path.resolve(pkgDirPath, 'bundle');

// Reset
rimraf.sync(bundlePath);
fs.mkdirSync(bundlePath);

// Get link dependencies path and package.json data
const links = (pkgDirPath => {
  const ret = {};

  function getPkg(p) {
    return require(path.resolve(p, 'package.json'));
  }

  function findLinks(root) {
    const pkg = ret[root] = getPkg(root);

    if (!pkg.link) { return; }

    pkg.link.forEach(relpath => {
      const abspath = path.resolve(root, relpath);

      // Visited
      if (ret[abspath]) { return; }

      findLinks(abspath);
    });
  }

  findLinks(pkgDirPath);
  return ret;
})(pkgDirPath);

Object.keys(links).forEach(linkpath => {
  // Import dependencies
  const pkg = links[linkpath];
  const dirname = path.relative(
    path.dirname(linkpath),
    linkpath
  );

  console.log(`Import ${dirname}`);

  // Pack
  exec(`npm pack ${linkpath}`, {
    cwd: bundlePath,
  }).toString().trim();

  // Untar
  const tarball = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
  const tempdir = '.' + dirname;
  exec(`${untar} extract ${tarball} ${tempdir}`, { cwd: bundlePath });
  fs.renameSync(
    path.resolve(bundlePath, tempdir, 'package'),
    path.resolve(bundlePath, dirname)
  );
  fs.unlinkSync(path.resolve(bundlePath, tarball));

  // TODO: Investigation
  // Some node_modules are remaining... npm bug?
  rimraf.sync(path.resolve(bundlePath, dirname, 'node_modules'));

  // Override package.json
  const dependencies = {};
  const sublinks = pkg.link;
  if (sublinks) {
    sublinks.forEach(p => {
      const ap = path.resolve(linkpath, p);
      const name = links[ap].name;
      dependencies[name] = p;
    });
  }
  const main = pkg['built:main'] || pkg.main;

  fs.writeFileSync(
    path.resolve(bundlePath, dirname, 'package.json'),
    JSON.stringify(_.defaultsDeep({
      dependencies,
      main,

      // Do not link and build
      scripts: { link: ' ', build: ' ' },
    }, pkg), null, '  ')
  );
});
