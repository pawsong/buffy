const gulp = require('gulp');
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

const BUNDLE_PATH = `${__dirname}/bundle`;

const gitignore = parser.compile(fs.readFileSync(`${__dirname}/.gitignore`, 'utf8'));
const MODULES = fs.readdirSync(`${__dirname}/modules`).filter(gitignore.accepts);

const numOfCpus = os.cpus().length;

// Promisified ncp
function cp(source, dest) {
  return new Promise((resolve, reject) => {
    ncp(source, dest, {
      dereference: true, // For locally linked jspm files
      limit: numOfCpus,
    }, err => err ? reject(err[0]) : resolve());
  });
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    spawn(command,  args || [], Object.assign({
      stdio: 'inherit',
    }, options))
      .on('error', err => reject(err))
      .on('close', code => code === 0 ? resolve() : reject(new Error(`exit code = ${code}`)));
  });
}

gulp.task('default', taskListing);

gulp.task('bundle:clean', function () {
  return del([
    `${BUNDLE_PATH}/**`,
    `!${BUNDLE_PATH}`,
    `!${BUNDLE_PATH}/.git`,
  ]);
});

MODULES.forEach(module => {
  gulp.task(`bundle:pack:${module}`, function () {
    const srcPath = `${__dirname}/modules/${module}`;
    const destPath = `${BUNDLE_PATH}/modules/${module}`;

    const pkg = require(`${srcPath}/package.json`);

    if (!pkg.files) {
      throw new Error('package.json must include `files` field');
    }

    return Promise.all([
      // Make and copy modified package.json.
      mkdirp(destPath).then(() => new Promise((resolve, reject) => {
        const dependencies = {};
        if (pkg.links) {
          pkg.links.forEach(link => {
            const linkPkg = require(`${srcPath}/${link}/package.json`);
            dependencies[linkPkg.name] = link;
          });
        }

        fs.writeFile(`${destPath}/package.json`, JSON.stringify(defaultsDeep({
          dependencies,
          scripts: { prepublish: ' ' },
        }, pkg), null, '  '), err => err ? reject(err) : resolve());
      })),

      // Run `npm install`.
      run('npm', ['install'], { cwd: srcPath }),
    ])

    // Copy `files` field entries recursively.
    .then(() => Promise.filter(pkg.files, entry => {
      return new Promise((resolve, reject) => {
        fs.lstat(`${srcPath}/${entry}`, (err, stats) => {
          if (err) { return reject(err); }
          resolve(stats.isDirectory());
        });
      });
    })).then(dirs => {
      return Promise.map(dirs, dir => mkdirp(`${destPath}/${dir}`));
    }).then(() => Promise.mapSeries(pkg.files, entry => {
      return cp(`${srcPath}/${entry}`, `${destPath}/${entry}`);
    }));
  });
});

gulp.task('bundle:pack', function (done) {
  // Topological sort with link dependency
  const graph = [];
  MODULES.forEach(module => {
    const pkg = require(`./modules/${module}/package.json`);
    if (!pkg.links) { return; }

    pkg.links.forEach(link => {
      graph.push([path.basename(link), module]);
    });
  });

  const sorted = toposort(graph);
  const allSorted = sorted.concat(difference(MODULES, sorted));
  runSequence.apply(null, allSorted.map(module => `bundle:pack:${module}`).concat([done]));
});

gulp.task('bundle:packagejson', function () {
  return mkdirp(BUNDLE_PATH).then(() => {
    return ncp(`${__dirname}/package.json`, `${BUNDLE_PATH}/package.json`);
  });
});

gulp.task('bundle:tools', function () {
  return mkdirp(BUNDLE_PATH).then(() => {
    return ncp(`${__dirname}/tools`, `${BUNDLE_PATH}/tools`);
  });
});

gulp.task('bundle:book', function () {
  return Promise.all([
    mkdirp(BUNDLE_PATH),
    run('npm', ['run', 'docs:build'], { cwd: __dirname }),
  ]).then(() => {
    return ncp(`${__dirname}/_book`, `${BUNDLE_PATH}/_book`);
  });
});

gulp.task('bundle:appdecl', function () {
  const pkg = require('./package.json');
  return mkdirp(BUNDLE_PATH).then(() => new Promise((resolve, reject) => {
    fs.writeFile(`${BUNDLE_PATH}/processes.json`, JSON.stringify({
      apps: pkg.deployables.map(deployable => ({
        name: deployable,
        script: require(`./modules/${deployable}/package.json`).start,
        cwd: `modules/${deployable}`,
        env: {
          NODE_ENV: 'production',
        },
      })),
    }, null, '  '), err => err ? reject(err) : resolve());
  }));
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
