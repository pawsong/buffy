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
const es = require('event-stream');
const runSequence = require('run-sequence');
const Childminder = require('childminder').Childminder;

const srcTsProject = ts.createProject('tsconfig.json', {
  typescript,
  declaration: true,
});

const testTsProject = ts.createProject('tsconfig.json', {
  typescript,
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
gulp.task('build', function () {
  let compileError = null;
  function handleError(err) {
    compileError = err;
    this.emit('end');
  }

  return gulp.src([
    'typings/tsd.d.ts',
    'src/**/*.ts',
  ]).pipe(sourcemaps.init())
    .pipe(ts(srcTsProject, undefined, ts.reporter.longReporter()))
    .on('error', handleError)
    .pipe(babel())
    .on('error', handleError)
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('lib'))
    .on('end', function () {
      // Make gulp-typescript stop on compile error.
      if (compileError) {
        this.emit('error', compileError);
      }
    });
});

// Test: Build test codes and run suites.
gulp.task('build:test', ['build'], function () {
  let compileError = null;

  return gulp.src([
    'typings/tsd.d.ts',
    'test/**/*.ts',
  ]).pipe(sourcemaps.init())
    .pipe(ts(testTsProject, undefined, ts.reporter.longReporter()))
    .on('error', err => compileError = err)
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.test'))
    .on('end', function () {
      // Make gulp-typescript stop on compile error.
      if (compileError) {
        this.emit('error', new gutil.PluginError('gulp-typescript', compileError.message));
      }
    });
});

gulp.task('test', function () {
  return gulp.src([
    '.test/**/*.js',
  ]).pipe(mocha({
    timeout: 60 * 1000,
    reporter: 'spec',
    require: ['source-map-support/register'],
  }));
});

gulp.task('test:rebuild', function (done) {
  runSequence('build:test', 'test', done);
});

gulp.task('test:watch', function () {
  runSequence('test');
  gulp.watch([
    'gulpfile.js',
    'tslint.json',
    'typings/tsd.d.ts',
    'src/**/*.ts',
    'test/**/*.ts',
  ], ['test:rebuild']);
});

// Serve: Serve built application
const cm = new Childminder();
const child = cm.create('node', [ 'lib/server' ], { lazy: true });

gulp.task('serve', ['build'], function () {
  return child.startOrRestart();
});

gulp.task('serve:watch', function () {
  runSequence('serve');
  gulp.watch([
    'gulpfile.js',
    'tslint.json',
    'typings/tsd.d.ts',
    'src/**/*.ts',
    'test/**/*.ts',
  ], ['serve']);
});
