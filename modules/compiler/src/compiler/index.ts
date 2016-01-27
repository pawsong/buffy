import * as Promise from 'bluebird';
import * as webpack from 'webpack';
import * as MemoryFileSystem from 'memory-fs';
import * as find from 'findit';
import * as path from 'path';
import * as shortid from 'shortid';
import * as pkgUp from 'pkg-up';

const PASTA_MODULE_DIR = 'pasta_modules';

const fs = Promise.promisifyAll(require("fs"));

const pkgDir = path.dirname(pkgUp.sync(__dirname));

const coreSrcDir = path.resolve(pkgDir, '..', 'core');
const coreDestDir = path.resolve(pkgDir, `${PASTA_MODULE_DIR}/\@pasta/core`);

const inputDir = path.resolve(pkgDir, '.in');
const outputDir = path.resolve(pkgDir, '.out');

function findModuleFiles(root): Promise<any[]> {
  let err = null;
  const files = [];

  return new Promise<any[]>((resolve, reject) => {
    const finder = find(root);

    finder.on('file', function (file, stat) {
      const relPath = path.relative(root, file)
      files.push(relPath);
    });

    finder.on('error', e => {
      err = e;
      finder.stop();
    });

    finder.on('end', () => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
}

function syncFileSystem(fileSystem, src, dest): Promise<{}> {
  return findModuleFiles(src).then(files => {

    // Copy files from local fs to memory fs
    return Promise.map(files, function(file) {
      const absPath = path.join(src, file);

      return fs.readFileAsync(absPath).then(data => {
        const destFile = path.resolve(dest, file);
        const dir = path.dirname(destFile);

        fileSystem.mkdirpSync(dir);
        fileSystem.writeFileSync(destFile, data);
      });
    }, { concurrency: 10 });
  });
}

const ifs = new MemoryFileSystem();

function init() {
  // Setup source directory
  ifs.mkdirpSync(inputDir);
  ifs.mkdirpSync(outputDir);
  return syncFileSystem(ifs, coreSrcDir, coreDestDir);
}

function compile(source) {
  const id = shortid.generate();

  const entryFile = `entry.${id}.js`;
  const entryFilePath = path.resolve(inputDir, entryFile);
  const srcFile = `src.${id}.js`;
  const srcFilePath = path.resolve(inputDir, srcFile);
  const bundleFile = `bundle.${id}.js`;
  const bundleFilePath = path.resolve(outputDir, bundleFile);

  const compiler = webpack({
    target: 'webworker',
    entry: entryFilePath,
    output: {
      path: outputDir,
      filename: bundleFile,
    },
    module: {
      loaders: [{
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015'],
          plugins: [
            'syntax-async-functions',
            'transform-regenerator',
            'syntax-object-rest-spread',
            'transform-object-rest-spread',
          ],
          babelrc: false,
        },
      }, {
        test: /\.ts(x?)$/,
        loader: 'ts-loader',
      }],
    },

    resolve: {
      modulesDirectories: [
        'node_modules',
        'web_modules',
        PASTA_MODULE_DIR,
      ],
    },

    devtool: '#inline-source-map',
  });

  compiler.inputFileSystem = ifs;
  compiler.resolvers.normal.fileSystem = compiler.inputFileSystem;
  compiler.resolvers.context.fileSystem = compiler.inputFileSystem;
  const ofs = compiler.outputFileSystem = new MemoryFileSystem();

  return new Promise((resolve, reject) => {
    // TODO: Make sure there is no remaining file.

    const entryFileContent = [
      `import './${srcFile}';`,
    ].join('\n');

    // Write code
    ifs.writeFileSync(entryFilePath, entryFileContent);
    ifs.writeFileSync(srcFilePath, source);

    compiler.run((err, stats) => {
      // Cleanup input file system
      ifs.unlinkSync(entryFilePath);

      if (err) { return reject(err); }

      const errors = stats.compilation.errors;
      if (errors && errors.length > 0) {
        return reject(errors);
      }

      const bundle = ofs.readFileSync(bundleFilePath).toString();

      resolve({ bundle });
    });
  });
}

export default {
  init,
  compile,
};
