const push = require('git-push');
const path = require('path');
const deploy = require('pm2-deploy');
const exec = require('child_process').execSync;
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const rootPkg = require(path.resolve(root, 'package.json'));

function getEnv (key, defaultVal) {
  const val = process.env[key] || '';
  if (!val && defaultVal === undefined) {
    throw new Error(`missing env: $${key}`);
  }
  return val || defaultVal;
}

const bucket = getEnv('PASTA_DEPLOY_S3_BUCKET');
const awsAccessKeyId = getEnv('PASTA_AWS_ACCESS_KEY_ID');
const awsSecretAccessKey = getEnv('PASTA_AWS_SECRET_KEY');
const awsS3Region = getEnv('PASTA_AWS_S3_REGION');

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

new Promise((resolve, reject) => {
  console.log(`push built files to ${deployConf.repo}`);
  push(`${__dirname}/../bundle`, deployConf.repo, err => err ? reject(err) : resolve());
}).catch(err => {
  if (err === 'Failed to push the contents.') { return; }
  throw(err);
}).then(() => {
  // Ensure app directory on server is set up
  console.log('Ensure all remote servers are set up...');

  const checkSetupCmd = `ssh -o "StrictHostKeyChecking no" \
  -p ${deployConf.port} ${deployConf.user}@${deployConf.host} \
  "[ -d ${deployConf.path}/current ] || echo setup"`;

  const needToSetup = exec(checkSetupCmd).toString().indexOf('setup') !== -1;

  if (!needToSetup) { return; }

  console.log(`Set up app on remote location: \
              ${deployConf.user}@${deployConf.host}:${deployConf.path}`);

  return new Promise((resolve, reject) => {
    deploy.deployForEnv({
      target: deployConf
    }, 'target', ['setup'], err => err ? reject(err) : resolve());
  });
}).then(() => {
  // Now deploy
  console.log('Deploy app to remote servers...');

  return new Promise((resolve, reject) => {
    deploy.deployForEnv({
      target: deployConf
    }, 'target', [], err => err ? reject(err) : resolve());
  });
}).then(() => {
  rootPkg.deployables.forEach(deployable => {
    const modulePath = path.resolve(root, 'modules', deployable);
    const pkg = require(path.resolve(modulePath, 'package.json'));
    if (!pkg.publicAssets) { return; }

    const abspath = path.resolve(modulePath, pkg.publicAssets);
    const dirname = path.dirname(abspath);
    const basename = path.basename(abspath);

    exec(
      `aws s3 cp ${dirname}/ s3://${bucket}/ --recursive --exclude "*" ` +
      `--region ${awsS3Region} ` +
      `--include "${basename}" --acl public-read ` +
      '--cache-control "max-age=31536000"', {
      env: {
        AWS_ACCESS_KEY_ID: awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
      },
    });
  });
}).catch(err => {
  console.error(err);
  process.exit(1);
});
