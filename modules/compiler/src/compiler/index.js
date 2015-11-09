import Promise from 'bluebird';
import webpack from 'webpack';
import MemoryFileSystem from 'memory-fs';
import find from 'findit';
import path from 'path';
import shortid from 'shortid';

const fs = Promise.promisifyAll(require("fs"));

var rootDir = __dirname + '/../../../../';

function findModuleFiles(root, done) {
  let err = null;
  const files = [];

  return new Promise((resolve, reject) => {
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

function syncFileSystem(fileSystem, dirname) {
  const absDir = path.resolve(rootDir, dirname);

  return findModuleFiles(absDir).then(files => {

    // Copy files from local fs to memory fs
    return Promise.map(files, function(file) {
      const absPath = path.join(absDir, file);

      return fs.readFileAsync(absPath).then(data => {
        //const destFile = path.join('/', dirname, file);
        const destFile = path.join('/pasta_modules/\@pasta', file);
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
  ifs.mkdirpSync('/src');

  return syncFileSystem(ifs, 'modules/core');
}

function compile(source) {
  const id = shortid.generate();

  const entryFile = `entry.${id}.js`;
  const entryFilePath = path.resolve('/src', entryFile);
  const bundleFile = `bundle.${id}.js`;
  const bundleFilePath = path.resolve('/dist', bundleFile);

  const compiler = webpack({
    entry: entryFilePath,

    output: {
      path: '/dist',
      filename: bundleFile,
    },

    module: {
      loaders: [
        {
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
          },
        },
      ],
    },

    resolve: {
      modulesDirectories: [
        'node_modules',
        'web_modules',
        'pasta_modules',
      ],
    },

    resolveLoader: {
      root: path.join(rootDir, 'node_modules')
    },

    //devtool: 'source-map',
    devtool: 'inline-source-map',
  });

  compiler.inputFileSystem = ifs;
  compiler.resolvers.normal.fileSystem = compiler.inputFileSystem;
  compiler.resolvers.context.fileSystem = compiler.inputFileSystem;
  const ofs = compiler.outputFileSystem = new MemoryFileSystem();

  return new Promise((resolve, reject) => {
    // TODO: Make sure there is no remaining file.

    // Write code
    ifs.writeFileSync(entryFilePath, source);

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
