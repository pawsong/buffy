const gulp = require('gulp');
const gutil = require('gulp-util');
const taskListing = require('gulp-task-listing');
const path = require('path');
const fs = require('fs');
const del = require('del');
const parser = require('gitignore-parser');
const spawn = require('child_process').spawn;
const toposort = require('toposort');
const ncp = require('ncp');
const os = require('os');
const mkdirp = require('mkdirp-then');
const defaultsDeep = require('lodash.defaultsdeep');
const difference = require('lodash.difference');
const runSequence = require('run-sequence');
const Promise = require('bluebird');

Promise.config({ warnings: false });

const ROOT = path.resolve(__dirname, '..');
const BUNDLE_PATH = `${ROOT}/bundle`;

const gitignore = parser.compile(fs.readFileSync(`${ROOT}/.gitignore`, 'utf8'));
const MODULES = fs.readdirSync(`${ROOT}/modules`).filter(gitignore.accepts);

const numOfCpus = os.cpus().length;

// Promisified ncp
async function cp(source, dest) {
  await new Promise((resolve, reject) => {
    ncp(source, dest, {
      dereference: true, // For locally linked jspm files
      limit: numOfCpus,
    }, err => err ? reject(err[0]) : resolve());
  });
}

async function run(command, args, options) {
  await new Promise((resolve, reject) => {
    spawn(command,  args || [], Object.assign({
      stdio: 'inherit',
    }, options))
      .on('error', err => reject(err))
      .on('close', code => code === 0 ? resolve() : reject(new Error(`exit code = ${code}`)));
  });
}

async function exists(file) {
  return await new Promise(resolve => {
    fs.access(file, err => err ? resolve(false) : resolve(true));
  });
}

async function writeJson(file, json) {
  await new Promise((resolve, reject) => {
    fs.writeFile(
      file,
      JSON.stringify(json, null, '  '),
      err => err ? reject(err) : resolve()
    );
  });
}

gulp.task('default', taskListing);

gulp.task('bundle:clean', async function () {
  await del([
    `${BUNDLE_PATH}/**`,
    `!${BUNDLE_PATH}`,
    `!${BUNDLE_PATH}/.git`,
  ]);
});

MODULES.forEach(module => {
  gulp.task(`bundle:pack:${module}`, async function () {
    const srcPath = `${ROOT}/modules/${module}`;
    const destPath = `${BUNDLE_PATH}/modules/${module}`;

    const pkg = require(`${srcPath}/package.json`);

    if (!pkg.files) {
      throw new Error('package.json must include `files` field');
    }

    const dependencies = {};
    if (pkg.links) {
      pkg.links.forEach(link => {
        const linkPkg = require(`${srcPath}/${link}/package.json`);
        dependencies[linkPkg.name] = link;
      });
    }

    await Promise.all([
      // Make and copy modified package.json.
      mkdirp(destPath).then(() => writeJson(`${destPath}/package.json`, defaultsDeep({
        dependencies,
        scripts: { prepublish: ' ' },
      }, pkg))),

      // Run `npm install`.
      run('npm', ['install'], { cwd: srcPath }),
    ]);

    // Copy `files` field entries recursively.
    const dirs = await Promise.filter(pkg.files, entry => {
      return new Promise((resolve, reject) => {
        fs.lstat(`${srcPath}/${entry}`, (err, stats) => {
          if (err) { return reject(err); }
          resolve(stats.isDirectory());
        });
      });
    });

    await Promise.map(dirs, dir => mkdirp(`${destPath}/${dir}`));

    await Promise.mapSeries(pkg.files, entry => {
      return cp(`${srcPath}/${entry}`, `${destPath}/${entry}`);
    });
  });
});

gulp.task('bundle:pack', function (done) {
  // Topological sort with link dependency
  const graph = [];
  MODULES.forEach(module => {
    const pkg = require(`${ROOT}/modules/${module}/package.json`);
    if (!pkg.links) { return; }

    pkg.links.forEach(link => {
      graph.push([path.basename(link), module]);
    });
  });

  const sorted = toposort(graph);
  const allSorted = sorted.concat(difference(MODULES, sorted));
  runSequence.apply(null, allSorted.map(module => `bundle:pack:${module}`).concat([done]));
});

gulp.task('bundle:packagejson', async function () {
  await mkdirp(BUNDLE_PATH);
  await ncp(`${ROOT}/package.json`, `${BUNDLE_PATH}/package.json`);
});

gulp.task('bundle:tools', async function () {
  await mkdirp(BUNDLE_PATH);
  await ncp(`${ROOT}/tools`, `${BUNDLE_PATH}/tools`);
});

gulp.task('bundle:book', async function () {
  await Promise.all([
    mkdirp(BUNDLE_PATH),
    run('npm', ['run', 'docs:build'], { cwd: ROOT }),
  ]);
  await ncp(`${ROOT}/_book`, `${BUNDLE_PATH}/_book`);
});

gulp.task('bundle:appdecl', async function () {
  const pkg = require(`${ROOT}/package.json`);
  await mkdirp(BUNDLE_PATH);
  await writeJson(`${BUNDLE_PATH}/processes.json`, {
    apps: pkg.deployables.map(deployable => ({
      name: deployable,
      script: require(`${ROOT}/modules/${deployable}/package.json`).start,
      cwd: `modules/${deployable}`,
      env: {
        NODE_ENV: 'production',
      },
    })),
  });
});

gulp.task('bundle', function (done) {
  runSequence('bundle:clean', [
    'bundle:pack',
    'bundle:packagejson',
    'bundle:tools',
    'bundle:book',
    'bundle:appdecl',
  ], done);
});
