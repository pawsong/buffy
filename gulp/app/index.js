const gulp = require('gulp');
const gutil = require('gulp-util');
const path = require('path');
const runSequence = require('run-sequence');
const taskListing = require('gulp-task-listing');
const eslint = require('gulp-eslint');
const tslint = require('gulp-tslint');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const tcpPortUsed = require('tcp-port-used');
const browserSync = require('browser-sync').create();
const Childminder = require('childminder').Childminder;
const notifier = require('node-notifier');
const superb = require('superb');
const webpackServer = require('./webpackServer');

const wcTemplate = {
  client: {
    development: require('./webpack/client.dev'),
    production: require('./webpack/client.prod'),
  },
  server: {
    development: require('./webpack/server.dev'),
    production: require('./webpack/server.prod'),
  }
};

module.exports = function (options) {
  function getWebpackOptions(target, env) {
    return (options.webpack[target] || [])
      .map(opts => Object.assign(opts, opts.env[env]))
      .map(opts => Object.assign(opts, {
        config: wcTemplate[target][env](opts),
      }));
  }

  function getCompileError(statsJson) {
    const { errors, warnings } = statsJson;
    if(errors.length > 0) {
      return new Error(statsJson.errors.join('\n'));
    }
    if(warnings.length > 0) {
      return new Error(statsJson.warnings.join('\n'));
    }
    return null;
  }

  function notifyCompileResult(name, statsJson) {
    const { errors, warnings } = statsJson;
    if (errors.length > 0) {
      errors.forEach(error => console.error(error));
      notifier.notify({
        title: `[${options.name}] Build ${name} failed`,
        message: errors[0],
      });
    } else if (warnings.length > 0) {
      warnings.forEach(warings => console.error(warnings));
      notifier.notify({
        title: `[${options.name}] Build ${name} failed`,
        message: warnings[0],
      });
    } else {
      notifier.notify({
        title: `[${options.name}] Build ${name} succeeded`,
        message: `${superb()}!`,
      });
    }
  }

  gulp.task('default', taskListing);

  // Lint
  gulp.task('lint:js', function () {
    return gulp.src([
      'gulpfile.js',
    ]).pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
  });

  gulp.task('lint:ts', function () {
    return gulp.src([
      'src/**/*.{ts,tsx}',
      'test/**/*.{ts,tsx}',
    ]).pipe(tslint())
      .pipe(tslint.report('verbose'));
  });

  gulp.task('lint', ['lint:js', 'lint:ts']);

  // Build
  function build(env) {
    return function () {
      gutil.log('Build env:', gutil.colors.bold(env));

      const clientOptions = getWebpackOptions('client', env);
      const serverOptions = getWebpackOptions('server', env);

      return Promise.all(clientOptions.concat(serverOptions).map(async ({ name, config }) => {
        gutil.log(`Start to compile '${name}'`);
        await new Promise((resolve, reject) => {
          webpack(config).run((err, stats) => {
            const error = err || getCompileError(stats.toJson());
            error ? reject(error) : resolve();
          });
        });
        gutil.log(`'${name}' complication succeeded`);
      }));
    };
  }

  gulp.task('build:dev', build('development'));

  gulp.task('build:prod', build('production'));

  // Test
  gulp.task('test', function () {
    console.log('test not yet implemented');
  });

  gulp.task('test:watch', function () {
    console.log('test:watch not yet implemented');
  });

  gulp.task('serve:dev:client', function (done) {
    const options = getWebpackOptions('client', 'development');

    return Promise.all(options.map(async ({ name, devServerPort, config }) => {
      const compiler = webpack(config);
      compiler.plugin('done', stats => {
        notifyCompileResult(name, stats.toJson());
      });

      await webpackServer(compiler, devServerPort);

      gutil.log(gutil.colors.bold(name), `listening at ${devServerPort}`);
    }));
  });

  gulp.task('serve:dev:server', function () {
    const options = getWebpackOptions('server', 'development');

    return Promise.all(options.map(({ name, config }) => new Promise(resolve => {
      const compiler = webpack(config);

      compiler.watch({}, (err, stats) => {
        const statsJson = stats.toJson();
        const error = err || getCompileError(statsJson);
        if (!error) { resolve(); }
        notifyCompileResult(name, statsJson);
      });
    })));
  });

  gulp.task('serve:dev', ['serve:dev:client', 'serve:dev:server'], async function () {
    const main = path.resolve(options.root, options.main);
    console.log(main);
    const cm = new Childminder();
    const child = cm.create('node', [main], { lazy: true });

    gulp.watch(main).on('change', () => {
      gutil.log('Restart server...');
      child.startOrRestart();
    });

    await child.startOrRestart();
    gutil.log('Everything is ready now!');
  });

  gulp.task('serve:dev:watch', ['build:server:dev:watch'], done => {
    if (!opts.useBrowserSync) {
      notifier.notify({
        title: `[${opts.prefix}] Start server succeeded`,
        message: `Now server is running on ${opts.port}`,
      });
      return done();
    }
    browserSync.init({
      port: opts.devPort,
      proxy: `http://localhost:${opts.port}`,
    }, done);
  });
};
