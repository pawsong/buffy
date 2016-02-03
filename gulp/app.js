'use strict'; // eslint-disable-line

require('babel-polyfill');

const _ = require('lodash');
const gulp = require('gulp');
const gutil = require('gulp-util');
const taskListing = require('gulp-task-listing');
const sourcemaps = require('gulp-sourcemaps');
const mocha = require('gulp-mocha');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const tslint = require('gulp-tslint');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const webpack = require('webpack');
const tcpPortUsed = require('tcp-port-used');
const browserSync = require('browser-sync').create();
const Childminder = require('childminder').Childminder;
const cache = require('./cache')();
const notifier = require('node-notifier');

function handleCompileError(done) {
  return function (err, stats) {
    if(err) {
      return done(err);
    }
    const jsonStats = stats.toJson();
    if(jsonStats.errors.length > 0) {
      return done(new Error(jsonStats.errors.join('\n')));
    }
    if(jsonStats.warnings.length > 0) {
      return done(new Error(jsonStats.warnings.join('\n')));
    }
    done();
  }
}

module.exports = function (options) {
  const opts = Object.assign({
    useBrowserSync: true,
  }, options);
  const wpConf = Object.assign({
    client: {
      dev: {},
      prod: {},
    },
  }, opts.webpackConfig);

  /**
   * webpack compilers
   */
  cache.set('compilerServerDev', () => webpack(wpConf.server.dev));
  cache.set('compilerServerProd', () => webpack(wpConf.server.prod));
  cache.set('compilerClientDev', () => {
    return _.mapValues(wpConf.client.dev, config => webpack(config));
  });
  cache.set('compilerClientProd', () => {
    return _.mapValues(wpConf.client.prod, config => webpack(config));
  });

  function compile(compiler) {
    return new Promise((resolve, reject) => {
      compiler.run(handleCompileError(err => err ? reject(err) : resolve()));
    });
  }

  gulp.task('help', taskListing);

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
  gulp.task('build:server:dev', function (done) {
    cache.get('compilerServerDev').run(handleCompileError(done));
  });

  gulp.task('build:server:prod', function (done) {
    cache.get('compilerServerProd').run(handleCompileError(done));
  });

  gulp.task('build:client:dev', function () {
    const compilerClientDev = cache.get('compilerClientDev');
    return Promise.all(
      Object.keys(compilerClientDev).map(key => compile(compilerClientDev[key]))
    );
  });

  gulp.task('build:client:prod', function () {
    const compilerClientProd = cache.get('compilerClientProd');
    return Promise.all(
      Object.keys(compilerClientProd).map(key => compile(compilerClientProd[key]))
    );
  });

  gulp.task('build:dev', ['build:client:dev', 'build:server:dev']);

  gulp.task('build:prod', ['build:client:prod', 'build:server:prod']);

  // Test
  gulp.task('test', function () {
    console.log('test not yet implemented');
  });

  gulp.task('test:watch', function () {
    console.log('test:watch not yet implemented');
  });

  /**
   * Child server process
   */
  cache.set('serverProc', function () {
    const cm = new Childminder();
    return cm.create('node', [ opts.main ], {
      prefix: opts.prefix,
      lazy: true,
    });
  });

  // Serve: Serve built application
  gulp.task('build:client:dev:watch', function () {
    const compilerClientDev = cache.get('compilerClientDev');
    return Promise.all(Object.keys(compilerClientDev).map(key => {
      const compiler = compilerClientDev[key];
      return new Promise(resolve => {
        compiler.watch({}, handleCompileError(err => {
          if (err) {
            console.error(err);
            return notifier.notify({
              title: `[${opts.prefix}] Build ${key} failed`,
              message: err.message,
            });
          }

          // Can be called multiple times.
          resolve();

          if (browserSync.active) { browserSync.reload(); }

          notifier.notify({
            title: `[${opts.prefix}] Build ${key} succeeded`,
            message: 'Good job!',
          });
        }));
      });
    }));
  });

  gulp.task('build:server:dev:watch', ['build:client:dev:watch'], function (done) {
    const compiler = cache.get('compilerServerDev');
    const serverProc = cache.get('serverProc');

    let hasDone = false;
    compiler.watch({}, handleCompileError(function (err) {
      // Resolve on first sucessful build
      if (err) {
        console.error(err);
        return notifier.notify({
          title: `[${opts.prefix}] Build server failed`,
          message: err.message,
        });
      }

      notifier.notify({
        title: `[${opts.prefix}] Build server succeeded`,
        message: 'Good job!',
      });

      return serverProc.startOrRestart().then(() => {
        return tcpPortUsed.waitUntilUsed(opts.port, 100, 60 * 1000);
      }).then(() => {
        if (!hasDone) { hasDone = true; done(); }
        if (browserSync.active) { browserSync.reload(); }
      }).catch(err => {
        console.error(err);
        notifier.notify({
          title: `[${opts.prefix}] Start server failed`,
          message: err.message,
        });
      });
    }));
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