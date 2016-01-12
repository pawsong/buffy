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

function handleCompileError(done) {
  return function (err, stats) {
    if(err) {
      return done(err);
    }
    const jsonStats = stats.toJson();
    if(jsonStats.errors.length > 0) {
      return done(new Error(jsonStats.errors));
    }
    if(jsonStats.warnings.length > 0) {
      return done(new Error(jsonStats.warnings));
    }
    done();
  }
}

module.exports = function (options) {
  const opts = options || {};
  const wpConf = opts.webpackConfig || {};

  /**
   * Typescript compiler for src code
   */
  cache.set('srcTsProject', function () {
    return ts.createProject('tsconfig.json', {
      typescript,
    });
  });

  /**
   * webpack compilers
   */
  cache.set('compilerServer', () => webpack(wpConf.server));
  cache.set('compilerAppDev', () => _.mapValues(wpConf.dev, config => webpack(config)));
  cache.set('compilerAppProd', () => _.mapValues(wpConf.prod, config => webpack(config)));

  function compile(compiler) {
    return new Promise((resolve, reject) => {
      compiler.run((error, stats) => {
        handleCompileError(err => err ? reject(err) : resolve())(error, stats);
      });
    });
  }

  /**
   * Child server process
   */
  cache.set('serverProc', function () {
    const cm = new Childminder();
    return cm.create('node', [ 'build/server' ], { lazy: true });
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
  gulp.task('build:server', function (done) {
    cache.get('compilerServer').run(handleCompileError(done));
  });

  gulp.task('build:client:dev', function () {
    const compilerAppDev = cache.get('compilerAppDev');
    return Promise.all(
      Object.keys(compilerAppDev).map(key => compile(compilerAppDev[key]))
    );
  });

  gulp.task('build:client:prod', function () {
    const compilerAppProd = cache.get('compilerAppProd');
    return Promise.all(
      Object.keys(compilerAppProd).map(key => compile(compilerAppProd[key]))
    );
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
  gulp.task('build:server:watch', function (done) {
    let hasDone = false;
    function callback (err) {
      if (hasDone) { return; }
      hasDone = true;
      done(err);
    }
    cache.get('compilerServer').watch({}, (error, stats) => {
      handleCompileError(function (err) {
        if (err) { return callback(err); }

        const serverProc = cache.get('serverProc');
        return serverProc.startOrRestart().then(() => {
          return tcpPortUsed.waitUntilUsed(opts.port, 100, 5000);
        }).then(() => {
          if (browserSync.active) {
            return browserSync.reload();
          }

          browserSync.init({
            port: opts.devPort,
            proxy: `http://localhost:${opts.port}`,
          }, callback);
        }).catch(callback);
      })(error, stats);
    });
  });

  gulp.task('build:client:dev:watch', function () {
    const compilerAppDev = cache.get('compilerAppDev');
    Object.keys(compilerAppDev).forEach(key => {
      const compiler = compilerAppDev[key];
      compiler.watch({}, (err, stats) => {
        if (!browserSync.active) { return; }
        browserSync.reload();
      });
    });
  });

  gulp.task('serve:dev', ['build:server:watch', 'build:client:dev:watch']);
};
