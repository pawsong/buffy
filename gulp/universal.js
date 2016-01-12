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
      compiler.run((error, stats) => {
        handleCompileError(err => err ? reject(err) : resolve())(error, stats);
      });
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
  gulp.task('build:server:dev', ['build:client:dev'], function (done) {
    cache.get('compilerServerDev').run(handleCompileError(done));
  });

  gulp.task('build:server:prod', ['build:client:prod'], function (done) {
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

  gulp.task('build:dev', ['build:server:dev']);

  gulp.task('build:prod', ['build:server:prod']);

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
  gulp.task('build:server:dev:watch', ['build:client:dev:watch'], function (done) {
    let hasDone = false;
    function callback (err) {
      if (hasDone) { return; }
      hasDone = true;
      done(err);
    }
    cache.get('compilerServerDev').watch({}, (error, stats) => {
      handleCompileError(function (err) {
        if (err) { return callback(err); }

        const serverProc = cache.get('serverProc');
        return serverProc.startOrRestart().then(() => {
          return tcpPortUsed.waitUntilUsed(opts.port, 100, 5000);
        }).then(() => {
          if (!browserSync.active) { return; }
          browserSync.reload();
        }).then(callback).catch(callback);
      })(error, stats);
    });
  });

  gulp.task('build:client:dev:watch', function () {
    const compilerClientDev = cache.get('compilerClientDev');
    return Promise.all(Object.keys(compilerClientDev).map(key => {
      return new Promise((resolve, reject) => {
        let hasDone = false;
        function callback (err) {
          if (hasDone) { return; }
          hasDone = true;
          err ? reject(err) : resolve();
        }
        const compiler = compilerClientDev[key];
        compiler.watch({}, (error, stats) => {
          handleCompileError(err => {
            callback(err);
            if (err || !browserSync.active) { return; }
            browserSync.reload();
          })(error, stats);
        });
      });
    }));
  });

  gulp.task('serve:dev:watch', ['build:server:dev:watch'], done => {
    browserSync.init({
      port: opts.devPort,
      proxy: `http://localhost:${opts.port}`,
    }, done);
  });
};
