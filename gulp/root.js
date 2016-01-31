const gulp = require('gulp');
const gutil = require('gulp-util');
const taskListing = require('gulp-task-listing');
const path = require('path');
const fs = require('fs');
const del = require('del');
const parser = require('gitignore-parser');
const childProcess = require('child_process');
const toposort = require('toposort');
const ncp = require('ncp');
const os = require('os');
const mkdirp = require('mkdirp-then');
const defaultsDeep = require('lodash.defaultsdeep');
const difference = require('lodash.difference');
const runSequence = require('run-sequence');
const Promise = require('bluebird');
const Repo = require('git-repository');
const deploy = require('pm2-deploy');

Promise.config({ warnings: false });

const ROOT = path.resolve(__dirname, '..');
const BUNDLE_PATH = `${ROOT}/bundle`;

const REV = childProcess.execSync('git rev-parse @').toString().trim();

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

async function spawn(command, args, options) {
  await new Promise((resolve, reject) => {
    childProcess.spawn(command,  args || [], Object.assign({
      stdio: 'inherit',
    }, options))
      .on('error', err => reject(err))
      .on('close', code => code === 0 ? resolve() : reject(new Error(`exit code = ${code}`)));
  });
}

async function exec(command, options) {
  function toStrArray(data) {
    return data.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  return await new Promise((resolve, reject) => {
    childProcess.exec(command, options || {}, (err, stdout, stderr) => {
      if (err) { return reject(err); }
      resolve({
        stdout: toStrArray(stdout),
        stderr: toStrArray(stderr),
      });
    });
  });
}

async function exists(file) {
  return await new Promise(resolve => {
    fs.access(file, err => err ? resolve(false) : resolve(true));
  });
}

async function readJson(file) {
  const content = await new Promise((resolve, reject) => {
    fs.readFile(
      file,
      (err, content) => err ? reject(err) : resolve(content)
    );
  });
  return JSON.parse(content);
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

function getEnv (key, defaultVal) {
  const val = process.env[key] || '';
  if (!val && defaultVal === undefined) {
    throw new Error(`missing env: $${key}`);
  }
  return val || defaultVal;
}

gulp.task('default', taskListing);

gulp.task('checkrepo', async function () {
  const tag = 'checkrepo';

  const { stdout: status } = await exec('git status --porcelain');
  if (status.length > 0) {
    throw new gutil.PluginError(tag, 'Need to commit changes');
  }

  const remoteRev = (await exec('git rev-parse @{u}')).stdout[0];
  if (remoteRev !== REV) {
    gutil.log('Local git repo is out of sync!');

    const baseRev = (await exec('git merge-base @ @{u}')).stdout[0];
    if (baseRev === REV) {
      throw new gutil.PluginError(tag, 'Nedd to run `git pull`');
    } else if (baseRev === remoteRev) {
      throw new gutil.PluginError(tag, 'Nedd to run `git push`');
    } else {
      throw new gutil.PluginError(tag,
        `Invalid revs (local=${REV}, remote=${remoteRev}, base=${baseRev}`
      );
    }
  }
});

gulp.task('bundle:clean', async function () {
  await del([
    `${BUNDLE_PATH}/*`,
    `!${BUNDLE_PATH}/.git/**`,
    `!${BUNDLE_PATH}/_book/**`,
    `!${BUNDLE_PATH}/modules`,
    `${BUNDLE_PATH}/modules/*`,
  ].concat(MODULES.map(module => `!${BUNDLE_PATH}/modules/${module}/**`)), {
    dot: true,
  });
});

MODULES.forEach(module => {
  gulp.task(`bundle:pack:${module}`, async function () {
    const srcPath = `${ROOT}/modules/${module}`;
    const destPath = `${BUNDLE_PATH}/modules/${module}`;
    const sealPath = `${destPath}/seal.json`;

    // Check if existing bundle is from latest rev.
    if (await exists(sealPath)) {
      const seal = await readJson(sealPath);
      if (seal.rev === REV) {
        gutil.log('Latest version is available. Skip.');
        return;
      }
    }

    await del(destPath);

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
      spawn('npm', ['install'], { cwd: srcPath }),
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

    await writeJson(sealPath, { rev: REV });
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
  await cp(`${ROOT}/package.json`, `${BUNDLE_PATH}/package.json`);
});

gulp.task('bundle:tools', async function () {
  await mkdirp(BUNDLE_PATH);
  await cp(`${ROOT}/tools`, `${BUNDLE_PATH}/tools`);
});

gulp.task('bundle:book', async function () {
  const destPath = `${BUNDLE_PATH}/_book`;
  const sealPath = `${destPath}/seal.json`;

  // Check if existing bundle is from latest rev.
  if (await exists(sealPath)) {
    const seal = await readJson(sealPath);
    if (seal.rev === REV) {
      gutil.log('Latest version is available. Skip.');
      return;
    }
  }

  await Promise.all([
    mkdirp(BUNDLE_PATH),
    spawn('npm', ['run', 'docs:build'], { cwd: ROOT }),
  ]);
  await cp(`${ROOT}/_book`, destPath);

  await writeJson(sealPath, { rev: REV });
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

gulp.task('deploy:bundle', async function () {
  const remote = {
    name: 'origin',
    url: getEnv('PASTA_DEPLOY_REPO'),
  };

  // Initialize a new Git repository inside the `/bundle` folder
  // if it doesn't exist yet
  const repo = await Repo.open(BUNDLE_PATH, { init: true });
  await repo.setRemote(remote.name, remote.url);

  // Fetch the remote repository if it exists
  if ((await repo.hasRef(remote.url, 'master'))) {
    await repo.fetch(remote.name);
    await repo.reset(`${remote.name}/master`, { hard: true });
    await repo.clean({ force: true });
  }

  await new Promise((resolve, reject) => {
    runSequence('bundle', err => err ? reject(err) : resolve());
  });

  // Push the contents of the build folder to the remote server via Git
  await repo.add('--all .');
  await repo.commit('Update');
  await repo.push(remote.name, 'master');
});

gulp.task('deploy:server', async function () {
  const deployConf = {
    user: getEnv('PASTA_DEPLOY_USER'),
    host: getEnv('PASTA_DEPLOY_HOST'),
    port: getEnv('PASTA_DEPLOY_PORT', 22),
    ref: 'origin/master',
    repo: getEnv('PASTA_DEPLOY_REPO'),
    path: '~/pasta',
    'post-deploy' : 'npm install --production && node tools/reinstall && ' +
      'pm2 startOrRestart processes.json',
  };

  // Ensure app directory on server is set up
  gutil.log('Ensure all remote servers are set up...');

  const checkSetupCmd = `ssh -o "StrictHostKeyChecking no" \
  -p ${deployConf.port} ${deployConf.user}@${deployConf.host} \
  "[ -d ${deployConf.path}/current ] || echo setup"`;

  const needToSetup = (await exec(checkSetupCmd)).stdout.join('').indexOf('setup') !== -1;

  if (needToSetup) {
    gutil.log(`Set up app on remote location: \
    ${deployConf.user}@${deployConf.host}:${deployConf.path}`);

    await new Promise((resolve, reject) => {
      deploy.deployForEnv({
        target: deployConf
      }, 'target', ['setup'], err => err ? reject(err) : resolve());
    });
  }

  gutil.log('Deploy app to remote servers...');
  await new Promise((resolve, reject) => {
    deploy.deployForEnv({
      target: deployConf
    }, 'target', [], err => err ? reject(err) : resolve());
  });
});

gulp.task('deploy:cdn', async function () {
  const bucket = getEnv('PASTA_DEPLOY_S3_BUCKET');
  const awsAccessKeyId = getEnv('PASTA_AWS_ACCESS_KEY_ID');
  const awsSecretAccessKey = getEnv('PASTA_AWS_SECRET_KEY');
  const awsS3Region = getEnv('PASTA_AWS_S3_REGION');

  const rootPkg = require(`${ROOT}/package.json`);

  await Promise.mapSeries(rootPkg.deployables, deployable => {
    const modulePath = `${ROOT}/modules/${deployable}`;
    const pkg = require(`${modulePath}/package.json`);
    if (!pkg.publicAssets) { return; }

    gutil.log(`Upload ${deployable} assets...`);

    const abspath = path.resolve(modulePath, pkg.publicAssets);
    const dirname = path.dirname(abspath);
    const basename = path.basename(abspath);

    return exec(`aws s3 cp ${dirname}/ s3://${bucket}/ --recursive --exclude "*" ` +
      `--region ${awsS3Region} ` +
      `--include "${basename}" --acl public-read ` +
      '--cache-control "max-age=31536000"', {
      env: {
        AWS_ACCESS_KEY_ID: awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
      },
    });
  });
});

gulp.task('deploy', ['checkrepo'], function (done) {
  runSequence('deploy:bundle', 'deploy:server', 'deploy:cdn', done);
});
