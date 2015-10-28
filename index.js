var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var dir = Promise.promisifyAll(require('node-dir'));


function apply(patterns, compiler) {

  var baseDir = compiler.options.context;

  compiler.plugin('emit', function(compilation, cb) {
    Promise.each(patterns, function(pattern) {
        var relSrc = pattern.from;
        var absSrc = path.resolve(baseDir, relSrc);
        var relDest = pattern.to || '';
        var forceWrite = !!pattern.force;

        return fs.statAsync(absSrc)
        .then(function(stat) {
          if (stat.isDirectory()) {
            return writeDirectoryToAssets(compilation,
                                          absSrc,
                                          relDest,
                                          forceWrite);
          } else {
            if ((path.extname(relDest) === '' ||  // doesn't have an extension
                _.last(relDest) === '/' ||        // doesn't end in a slash
                pattern.toType === 'dir') &&      // is explicitly a dir
                pattern.toType !== 'file') {      // is not explicitly a file
              relDest = path.join(relDest, path.basename(relSrc));
            } else {
              relDest = relDest || path.basename(relSrc);
            }
            return writeFileToAssets(compilation,
                                     absSrc,
                                     relDest,
                                     forceWrite);
          }
        });
      })
      .catch(function(err) {
        compilation.errors.push(err);
      })
      .finally(cb);
  });
}

function writeFileToAssets(compilation, absFileSrc, relFileDest, forceWrite) {
  if (compilation.assets[relFileDest] && !forceWrite) {
    return Promise();
  }
  return fs.statAsync(absFileSrc)
    .then(function(stat) {
      compilation.assets[relFileDest] = {
        size: function() {
          return stat.size;
        },
        source: function() {
          return fs.readFileSync(absFileSrc);
        }
      };
    });
}

function writeDirectoryToAssets(compilation, absDirSrc, relDirDest, forceWrite) {
  return dir.filesAsync(absDirSrc)
  .each(function(absFileSrc) {
    var relFileSrc = absFileSrc.replace(absDirSrc, '');
    var relFileDest = path.join(relDirDest, relFileSrc);

    // Make sure it doesn't start with the separator
    if (_.first(relFileDest) === '/') {
      relFileDest = relFileDest.substr(1);
    }

    return writeFileToAssets(compilation, absFileSrc, relFileDest, forceWrite);
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
