const path = require('path');
const fs = require('fs-extra');
const del = require('del');
const pkgDir = require('pkg-dir');
const _ = require('lodash');
const parser = require('gitignore-parser');
const exec = require('child_process').execSync;
const toposort = require('toposort');

const root = pkgDir.sync(__dirname);
const rootPkg = require(path.resolve(root, 'package.json'));

// Untar command
const untar = path.resolve(root, 'node_modules/.bin/targz');

const bundlePath = path.resolve(root, 'bundle');

// Reset
del.sync([
  `${bundlePath}/**`,
  `!${bundlePath}`,
  `!${bundlePath}/.git`,
]);
fs.mkdirsSync(path.resolve(bundlePath, 'modules'));

const gitignore = parser.compile(fs.readFileSync(__dirname + '/../.gitignore', 'utf8'));
const modules = fs.readdirSync(path.resolve(root, 'modules')).filter(gitignore.accepts);

// Topological sort with link dependency
const graph = [];
modules.forEach(module => {
  const srcPath = path.resolve(root, 'modules', module);
  const pkgFile = path.resolve(srcPath, 'package.json');
  if (!fs.existsSync(pkgFile)) { return; }

  const pkg = require(pkgFile);
  if (!pkg.link) { return; }

  pkg.link.forEach(link => {
    graph.push([path.basename(link), module]);
  });
});

const sorted = toposort(graph);
sorted.concat(_.difference(modules, sorted)).forEach(module => {
  console.log(`Import ${module}`);

  const srcPath = path.resolve(root, 'modules', module);
  const destPath = path.resolve(bundlePath, 'modules', module);

  const pkgFile = path.resolve(srcPath, 'package.json');

  if (!fs.existsSync(pkgFile)) {
    fs.copySync(srcPath, destPath);
    return;
  }

  const pkg = require(pkgFile);

  // Import dependencies
  // Pack
  exec(`npm pack ${srcPath}`, {
    cwd: bundlePath,
  }).toString().trim();

  // Untar
  const tarball = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
  const tempdir = '.' + module;
  exec(`${untar} extract ${tarball} ${tempdir}`, { cwd: bundlePath });
  fs.renameSync(
    path.resolve(bundlePath, tempdir, 'package'),
    destPath
  );
  fs.unlinkSync(path.resolve(bundlePath, tarball));

  // TODO: Investigation
  // Some node_modules are remaining... npm bug?
  del.sync(path.resolve(destPath, 'node_modules'));

  // Override package.json
  const dependencies = {};
  const links = pkg.link;
  if (links) {
    links.forEach(link => {
      const linkPkg = require(path.resolve(srcPath, link, 'package.json'));
      dependencies[linkPkg.name] = link;
    });
  }
  const main = pkg['built:main'] || pkg.main;

  fs.writeFileSync(
    path.resolve(destPath, 'package.json'),
    JSON.stringify(_.defaultsDeep({
      dependencies,
      main,

      // Do not link and build
      scripts: { prepublish: ' ' },
    }, pkg), null, '  ')
  );
});

// package.json
fs.copySync(
  path.resolve(root, 'package.json'),
  path.resolve(bundlePath, 'package.json')
);

// tools
fs.copySync(
  path.resolve(root, 'tools'),
  path.resolve(bundlePath, 'tools')
);

// _book
fs.copySync(
  path.resolve(root, '_book'),
  path.resolve(bundlePath, '_book')
);

// processes.json
const appDecl = {
  apps: rootPkg.deployables.map(deployable => ({
    name: deployable,
    script: require(`../modules/${deployable}/package.json`).main,
    cwd: `modules/${deployable}`,
    env: {
      NODE_ENV: 'production'
    },
  })),
};
fs.writeFileSync(
  path.resolve(bundlePath, 'processes.json'),
  JSON.stringify(appDecl, null, '  ')
);
