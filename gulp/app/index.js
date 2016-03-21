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
const open = require('open');

import fs from 'fs';

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
    // if(warnings.length > 0) {
    //   return new Error(statsJson.warnings.join('\n'));
    // }
    return null;
  }

  function isCompileFailed(statsJson) {
    return statsJson.errors.length > 0;
  }

  function notifyCompileResult(name, statsJson) {
    const { errors, warnings } = statsJson;
    if (errors.length > 0) {
      errors.forEach(error => console.error(error));
      notifier.notify({
        title: `[${options.name}] Build ${name} failed`,
        message: errors[0],
      });
    // } else if (warnings.length > 0) {
    //   warnings.forEach(warings => console.error(warnings));
    //   notifier.notify({
    //     title: `[${options.name}] Build ${name} failed`,
    //     message: warnings[0],
    //   });
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
            console.log(stats.toString());
            // TODO: Ensure modue paths are under root to prevent redundent module load.
            error ? reject(error) : resolve();
          });
        });
        gutil.log(`'${name}' compilation succeeded`);
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

    return Promise.all(options.map(async ({ name, devServerPort, config, postCompile }) => {
      const compiler = webpack(config);
      compiler.plugin('done', stats => {
        const statsJson = stats.toJson();
        if (isCompileFailed(statsJson)) return notifyCompileResult(name, statsJson);
        if (!postCompile) return notifyCompileResult(name, statsJson);

        postCompile(function (error) {
          if (error) {
            notifier.notify({
              title: `[${name}] Post compile hook failed`,
              message: error && error.message,
            });
            return;
          }
          notifyCompileResult(name, statsJson);
        });
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

  gulp.task('serve:dev', async function () {
    if (options.hooks && options.hooks['serve:dev:start']) {
      options.hooks['serve:dev:start']();
    }

    await new Promise((resolve, reject) => {
      runSequence([
        'serve:dev:client',
        'serve:dev:server',
      ], err => err ? reject(err) : resolve())
    });

    const main = path.resolve(options.root, options.main);
    const cm = new Childminder();
    const child = cm.create('node', [main], { lazy: true });

    gulp.watch(main).on('change', async () => {
      gutil.log('Restart server...');

      await child.kill();
      await tcpPortUsed.waitUntilFree(options.port, 100, 60 * 1000)

      await child.startOrRestart();
    });

    await child.startOrRestart();
    await tcpPortUsed.waitUntilUsed(options.port, 100, 60 * 1000);

    gutil.log('Everything is ready now!');

    notifier.notify({
      title: `[${options.name}] Server is ready`,
      message: `Now server is running on ${options.port}`,
    });

    if (options.open) {
      open(`http://localhost:${options.port}`);
    }
  });
};
