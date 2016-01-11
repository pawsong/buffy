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
const cache = require('../../gulp/cache')();
const iconf = require('@pasta/config-internal');

const opts = {
  port: iconf.consolePort,
  devPort: iconf.consoleDevPort,
};

/**
 * Typescript compiler for src code
 */
cache.set('srcTsProject', () => ts.createProject('tsconfig.json', {
  typescript,
}));

/**
 * webpack compilers
 */
cache.set('compilerAppDev', () => webpack(require('./webpack/app.dev')));
cache.set('compilerAppProd', () => webpack(require('./webpack/app.prod')));
cache.set('compilerWorkerDev', () => webpack(require('./webpack/worker.dev')));
cache.set('compilerWorkerProd', () => webpack(require('./webpack/worker.prod')));

function compile(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => err ? reject(err) : resolve());
  });
}

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
    'src/**/*.{ts,tsx}',
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
    'src/**/*.{ts,tsx}',
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

gulp.task('build:client:dev', function () {
  return Promise.all([
    compile(cache.get('compilerAppDev')),
    compile(cache.get('compilerWorkerDev')),
  ]);
});

gulp.task('build:client:prod', function (done) {
  return Promise.all([
    compile(cache.get('compilerAppProd')),
    compile(cache.get('compilerWorkerProd')),
  ]);
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
    'src/**/*.{ts,tsx}',
  ], ['serve:dev']);

  browserSync.init({
    port: opts.devPort,
    proxy: `http://localhost:${opts.port}`,
  });
});
