'use strict'; // eslint-disable-line

require('babel-polyfill');

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

module.exports = function (options) {
  const opts = options || {};
  const wpConf = opts.webpackConfig || {};

  /**
   * Typescript compiler for src code
   */
  cache.set('srcTsProject', function () {
    return ts.createProject('tsconfig.json', {
      typescript,
      declaration: true,
    });
  });

  /**
   * webpack compiler for development
   */
  cache.set('compilerDev', function () {
    return webpack(wpConf.dev);
  });

  /**
   * webpack compiler for production
   */
  cache.set('compilerProd', function () {
    return webpack(wpConf.prod);
  });

  /**
   * Child server process
   */
  cache.set('serverProc', function () {
    const cm = new Childminder();
    return cm.create('node', [ 'lib/server' ], { lazy: true });
  });

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
      'src/**/*.ts',
      'test/**/*.ts',
    ]).pipe(tslint())
      .pipe(tslint.report('verbose'));
  });

  gulp.task('lint', ['lint:js', 'lint:ts']);

  // Build
  gulp.task('build:server', function () {
    let compileError = null;

    const tsResult = gulp.src([
      'typings/tsd.d.ts',
      'src/**/*.ts',
    ]).pipe(sourcemaps.init())
      .pipe(ts(cache.get('srcTsProject'), undefined, ts.reporter.longReporter()))
      .on('error', err => compileError = err)
      .pipe(babel())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('lib'))
      .on('end', function () {
        // Make gulp-typescript stop on compile error.
        if (compileError) {
          this.emit('error', new gutil.PluginError('gulp-typescript', compileError.message));
        }
      });
  });

  gulp.task('build:client:dev', function (done) {
    cache.get('compilerDev').run((err, stats) => {
      done(err);
    });
  });

  gulp.task('build:client:prod', function (done) {
    cache.get('compilerProd').run((err, stats) => {
      done(err);
    });
  });

  gulp.task('build:dev', ['build:server', 'build:client:dev']);

  gulp.task('build:prod', ['build:server', 'build:client:prod']);

  // Test
  gulp.task('test', function () {
    console.log('test not yet implemented');
  });

  gulp.task('test:watch', function () {
    console.log('test:watch not yet implemented');
  });

  // Serve: Serve built application
  gulp.task('serve:dev', ['build:dev'], function () {
    const serverProc = cache.get('serverProc');
    return serverProc.startOrRestart().then(() => {
      return tcpPortUsed.waitUntilUsed(opts.port, 100, 5000);
    }).then(() => {
      if (!browserSync.active) { return; }
      browserSync.reload();
    });
  });

  gulp.task('serve:dev:watch', ['serve:dev'], function () {
    gulp.watch([
      'gulpfile.js',
      'tslint.json',
      'typings/tsd.d.ts',
      'src/**/*.ts',
    ], ['serve:dev']);

    browserSync.init({
      port: opts.devPort,
      proxy: `http://localhost:${opts.port}`,
    });
  });
};
