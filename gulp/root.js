const gulp = require('gulp');
const gutil = require('gulp-util');
const taskListing = require('gulp-task-listing');
const path = require('path');
const fs = require('fs');
const del = require('del');
const parser = require('gitignore-parser');
const childProcess = require('child_process');
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

const ROOT_PKG = require(`${ROOT}/package.json`);

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

function toStrArray(data) {
  return data.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

async function spawn(command, args, options) {
  return await new Promise((resolve, reject) => {
    const child = childProcess.spawn(command,  args || [], Object.assign({
      stdio: 'inherit',
    }, options));

    let stdout = '';
    let stderr = '';

    child.stdout && child.stdout.on('data', data => {
      const msg = data.toString().trim();
      stdout += msg;
    });
    child.stderr && child.stderr.on('data', data => {
      const msg = data.toString().trim();
      stderr += msg;
    });

    child.on('error', err => reject(err))
    child.on('close', code => {
      if (code === 0) {
        return resolve({
          stdout: toStrArray(stdout),
          stderr: toStrArray(stderr),
        });
      }
      const error = new Error(`exit code = ${code}`);
      error.code = code;
      error.stdout = toStrArray(stdout);
      error.stderr = toStrArray(stderr);
      reject(error);
    });
  });
}

async function exec(command, options) {
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

async function isSealed(sealPath) {
  if (await exists(sealPath)) {
    const seal = await readJson(sealPath);
    if (seal.rev === REV) { return true; }
  }
  return false;
}

async function seal(sealPath) {
  await writeJson(sealPath, { rev: REV });
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

MODULES.forEach(module => {
  gulp.task(`bundle:module:${module}`, ['checkrepo'], async function () {
    const srcPath = `${ROOT}/modules/${module}`;
    const destPath = `${BUNDLE_PATH}/modules/${module}`;
    const sealPath = `${destPath}/seal.json`;

    // Check if existing bundle is from latest rev.
    if (await isSealed(sealPath)) {
      gutil.log('Latest version is available. Skip.');
      return;
    }

    await del(destPath);
    await mkdirp(destPath);

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
      writeJson(`${destPath}/package.json`, defaultsDeep({
        dependencies,
        scripts: { prepublish: ' ' },
      }, pkg)),

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

    await seal(sealPath);
  });
});

// DFS -> Topological sort
function resolveDependencies(module, discovered, sorted) {
  discovered[module] = true;
  const pkg = require(`${ROOT}/modules/${module}/package.json`);
  if (pkg.links) {
    pkg.links.forEach(link => {
      const linkMod = path.basename(link);
      if (discovered[linkMod]) { return; }
      resolveDependencies(linkMod, discovered, sorted);
    });
  }
  sorted.push(module);
}

ROOT_PKG.deployables.forEach(module => {
  gulp.task(`bundle:app:${module}`, async function() {
    const destPath = `${BUNDLE_PATH}/apps/${module}`;
    const sealPath = `${destPath}/seal.json`;

    // Check if existing bundle is from latest rev
    if (await isSealed(sealPath)) {
      gutil.log('Latest version is available. Skip.');
      return;
    }

    // Bundle modules
    await del([
      `${destPath}/*`,
      `!${destPath}/.git/**}`,
    ]);
    await mkdirp(`${destPath}/modules`);

    // Resolve dependencies
    const sorted = [];
    resolveDependencies(module, {}, sorted);

    // Bundle and copy
    for (let i = 0; i < sorted.length; ++i) {
      const mod = sorted[i];
      await new Promise((resolve, reject) => {
        runSequence(`bundle:module:${mod}`, err => err ? reject(err) : resolve());
      });
      await cp(`${BUNDLE_PATH}/modules/${mod}`, `${destPath}/modules/${mod}`);
    }

    // Make app declaration
    await writeJson(`${destPath}/processes.json`, {
      apps: [{
        name: module,
        script: require(`${destPath}/modules/${module}/package.json`).start,
        cwd: `modules/${module}`,
        env: {
          NODE_ENV: 'production',
        },
      }],
    });

    await cp(`${ROOT}/package.json`, `${destPath}/package.json`);
    await cp(`${ROOT}/tools`, `${destPath}/tools`);

    await seal(sealPath);
  });

  gulp.task(`deploy:${module}:repo`, async function () {
    const appPath = `${BUNDLE_PATH}/apps/${module}`;

    async function runGitCommand(args, isError) {
      try {
        return await spawn('git', args, { cwd: appPath, stdio: 'pipe' });
      } catch(err) {
        if (isError && !isError(err)) { return; }
        err.stdout.forEach(line => console.log(line));
        err.stderr.forEach(line => console.error(line));
        throw new gutil.PluginError('git', `command failed: git ${args.join(' ')}`);
      }
    }

    await mkdirp(appPath);

    const remote = {
      name: 'origin',
      url: getEnv('PASTA_DEPLOY_REPO'),
    };

    // Initialize a new Git repository inside the `/bundle` folder
    // if it doesn't exist yet
    const repo = await Repo.open(appPath, { init: true });
    await repo.setRemote(remote.name, remote.url);

    if (undefined === await runGitCommand(['rev-parse', '--verify', module], err => {
      return err.stderr[0] !== 'fatal: Needed a single revision';
    })) {
      await runGitCommand(['checkout', '-b', module]);
    }

    const branch = (await runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'])).stdout[0];
    if (branch !== 'admin') {
      await runGitCommand(['checkout', module]);
    }

    // Fetch the remote repository if it exists
    if ((await repo.hasRef(remote.url, module))) {
      await repo.fetch(remote.name);
      await repo.reset(`${remote.name}/${module}`, { hard: true });
      await repo.clean({ force: true });
    }

    await new Promise((resolve, reject) => {
      runSequence(`bundle:app:${module}`, err => err ? reject(err) : resolve());
    });

    // Push the contents of the build folder to the remote server via Git
    await runGitCommand(['add', '--all', '.']);
    await runGitCommand(['commit', '-m', `'Update (rev: ${REV})'`], err => {
      return err.stdout.indexOf('nothing to commit, working directory clean') === -1;
    });
    await runGitCommand(['push', '-u', remote.name, module]);
  });

  gulp.task(`deploy:${module}:cdn`, async function () {
    const bucket = getEnv('PASTA_DEPLOY_S3_BUCKET');
    const awsAccessKeyId = getEnv('PASTA_AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = getEnv('PASTA_AWS_SECRET_KEY');
    const awsS3Region = getEnv('PASTA_AWS_S3_REGION');

    const modulePath = `${ROOT}/modules/${module}`;
    const pkg = require(`${modulePath}/package.json`);
    if (!pkg.publicAssets) { return; }

    const abspath = path.resolve(modulePath, pkg.publicAssets);
    const dirname = path.dirname(abspath);
    const basename = path.basename(abspath);

    await exec(`aws s3 cp ${dirname}/ s3://${bucket}/ --recursive --exclude "*" ` +
      `--region ${awsS3Region} ` +
      `--include "${basename}" --acl public-read ` +
      '--cache-control "max-age=31536000"', {
      env: {
        AWS_ACCESS_KEY_ID: awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
      },
    });
  });

  gulp.task(`deploy:${module}:server`, async function () {
    const deployConf = {
      user: getEnv('PASTA_DEPLOY_USER'),
      host: getEnv('PASTA_DEPLOY_HOST'),
      port: getEnv('PASTA_DEPLOY_PORT', 22),
      ref: `origin/${module}`,
      repo: getEnv('PASTA_DEPLOY_REPO'),
      path: `~/apps/${module}`,
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

    await new Promise((resolve, reject) => {
      deploy.deployForEnv({
        target: deployConf
      }, 'target', [], err => err ? reject(err) : resolve());
    });
  });

  gulp.task(`deploy:${module}`, function (done) {
    runSequence(
      `deploy:${module}:repo`,
      `deploy:${module}:cdn`,
      `deploy:${module}:server`,
      done
    );
  });
});
