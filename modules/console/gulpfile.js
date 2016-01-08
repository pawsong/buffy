'use strict'; // eslint-disable-line

require('babel-polyfill');

const gulp = require('gulp');
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const mocha = require('gulp-mocha');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const tslint = require('gulp-tslint');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const es = require('event-stream');
const runSequence = require('run-sequence');

const srcTsProject = ts.createProject('tsconfig.json', {
  typescript,
});

const testTsProject = ts.createProject('tsconfig.json', {
  typescript,
});

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

gulp.task('build', function () {
  let compileError = null;

  const tsResult = gulp.src([
    'typings/tsd.d.ts',
    'src/**/*.{ts,tsx}',
  ]).pipe(sourcemaps.init())
    .pipe(ts(srcTsProject, undefined, ts.reporter.longReporter()))
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

gulp.task('test:run', ['build:test'], function () {
  return gulp.src([
    '.test/**/*.js',
  ]).pipe(mocha({
    timeout: 60 * 1000,
    reporter: 'spec',
    require: ['source-map-support/register'],
  }));
});

gulp.task('test', function (done) {
  runSequence('lint', 'test:run', done);
});

gulp.task('test:watch', function () {
  runSequence('test');
  gulp.watch([
    'gulpfile.js',
    'tslint.json',
    'typings/tsd.d.ts',
    'src/**/*.ts',
    'test/**/*.ts',
  ], ['test']);
});
