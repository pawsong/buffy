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

const srcTsProject = ts.createProject('tsconfig.json', {
  typescript,
  declaration: true,
});

const testTsProject = ts.createProject('tsconfig.json', {
  typescript,
});

gulp.task('help', taskListing);

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

gulp.task('build', function () {
  let compileError = null;
  function handleError(err) {
    compileError = err;
    this.emit('end');
  }

  const tsResult = gulp.src([
    'typings/tsd.d.ts',
    'src/**/*.{ts,tsx}',
  ]).pipe(sourcemaps.init())
    .pipe(ts(srcTsProject, undefined, ts.reporter.longReporter()))
    .on('error', handleError);

  return es.merge([
    // declaration files
    tsResult.dts
      .pipe(gulp.dest('lib')),

    // js files
    tsResult.js
      .pipe(babel())
      .on('error', handleError)
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('lib')),
  ]).on('end', function () {
    if (compileError) {
      this.emit('error', compileError);
    }
  });
});

gulp.task('build:test', ['build'], function () {
  let compileError = null;
  function handleError(err) {
    compileError = err;
    this.emit('end');
  }

  return gulp.src([
    'typings/tsd.d.ts',
    'test/**/*.{ts,tsx}',
  ]).pipe(sourcemaps.init())
    .pipe(ts(testTsProject, undefined, ts.reporter.longReporter()))
    .on('error', handleError)
    .pipe(babel())
    .on('error', handleError)
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.test'))
    .on('end', function () {
      // Make gulp-typescript stop on compile error.
      if (compileError) {
        this.emit('error', compileError);
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
    'src/**/*.{ts,tsx}',
    'test/**/*.{ts,tsx}',
  ], ['test']);
});
