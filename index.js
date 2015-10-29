var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var dir = Promise.promisifyAll(require('node-dir'));


function apply(patterns, compiler) {

  var baseDir = compiler.options.context;
  var fileDependencies = [];
  var contextDependencies = [];
  var lastGlobalUpdate = 0;

  compiler.plugin('emit', function(compilation, cb) {
    Promise.each(patterns, function(pattern) {
      var relSrc = pattern.from;
      var absSrc = path.resolve(baseDir, relSrc);
      var relDest = pattern.to || '';
      var forceWrite = !!pattern.force;

      return fs.statAsync(absSrc)
      .then(function(stat) {
        if (stat.isDirectory()) {
          contextDependencies.push(absSrc);
          return writeDirectoryToAssets({
            compilation: compilation,
            absDirSrc: absSrc,
            relDirDest: relDest,
            forceWrite: forceWrite,
            lastGlobalUpdate: lastGlobalUpdate
          });
        } else {
          fileDependencies.push(absSrc);
          if ((path.extname(relDest) === '' ||  // doesn't have an extension
              _.last(relDest) === '/' ||        // doesn't end in a slash
              pattern.toType === 'dir') &&      // is explicitly a dir
              pattern.toType !== 'file') {      // is not explicitly a file
            relDest = path.join(relDest, path.basename(relSrc));
          } else {
            relDest = relDest || path.basename(relSrc);
          }
          return writeFileToAssets({
            compilation: compilation,
            absFileSrc: absSrc,
            relFileDest: relDest,
            forceWrite: forceWrite,
            lastGlobalUpdate: lastGlobalUpdate
          });
        }
      });
    })
    .then(function() {
      lastGlobalUpdate = _.now();
    })
    .catch(function(err) {
      compilation.errors.push(err);
    })
    .finally(cb);
  });

  compiler.plugin("after-emit", function(compilation, cb) {
    var trackedFiles = compilation.fileDependencies;
    _.each(fileDependencies, function(file) {
      if (!_.contains(trackedFiles, file)) {
        trackedFiles.push(file);
      }
    });

    var trackedDirs = compilation.contextDependencies;
    _.each(contextDependencies, function(context) {
      if (!_.contains(trackedDirs, context)) {
        trackedDirs.push(context);
      }
    });

    cb();
  });
}

function writeFileToAssets(opts) {
  var compilation = opts.compilation;
  var relFileDest = opts.relFileDest;
  var absFileSrc = opts.absFileSrc;
  var forceWrite = opts.forceWrite;
  var lastGlobalUpdate = opts.lastGlobalUpdate;

  if (compilation.assets[relFileDest] && !forceWrite) {
    return Promise.resolve();
  }
  return fs.statAsync(absFileSrc)
  .then(function(stat) {
    if (stat.mtime.getTime() > lastGlobalUpdate) {
      compilation.assets[relFileDest] = {
        size: function() {
          return stat.size;
        },
        source: function() {
          return fs.readFileSync(absFileSrc);
        }
      };
    }
  });
}

function writeDirectoryToAssets(opts) {
  var compilation = opts.compilation;
  var absDirSrc = opts.absDirSrc;
  var relDirDest = opts.relDirDest;
  var forceWrite = opts.forceWrite;
  var lastGlobalUpdate = opts.lastGlobalUpdate;

  return dir.filesAsync(absDirSrc)
  .each(function(absFileSrc) {
    var relFileSrc = absFileSrc.replace(absDirSrc, '');
    var relFileDest = path.join(relDirDest, relFileSrc);

    // Make sure it doesn't start with the separator
    if (_.first(relFileDest) === '/') {
      relFileDest = relFileDest.substr(1);
    }

    return writeFileToAssets({
      compilation: compilation,
      absFileSrc: absFileSrc,
      relFileDest: relFileDest,
      forceWrite: forceWrite,
      lastGlobalUpdate: lastGlobalUpdate
    });
  });
}

module.exports = function(patterns) {
  if (_.isUndefined(patterns)) {
    patterns = [];
  }

  if (!_.isArray(patterns)) {
    throw new Error('CopyWebpackPlugin: patterns must be an array');
  }

  return {
    apply: apply.bind(this, patterns)
  };
};
