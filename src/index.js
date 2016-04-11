import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import toLooksLikeDirectory from './toLooksLikeDirectory';
import writeFileToAssets from './writeFileToAssets';
import writeDirectoryToAssets from './writeDirectoryToAssets';
import shouldIgnore from './shouldIgnore';

/* eslint-disable import/no-commonjs */
const globAsync = Promise.promisify(require('glob'));
const fs = Promise.promisifyAll(require('fs-extra'));
/* eslint-enable */

export default (patterns = [], options = {}) => {
  if (!_.isArray(patterns)) {
    throw new Error('CopyWebpackPlugin: patterns must be an array');
  }

  const apply = (compiler) => {
    const baseDir = compiler.options.output.path;
    const fileDependencies = [];
    const contextDependencies = [];
    const ignoreList = options.ignore;

    compiler.plugin('emit', (compilation, cb) => {
      Promise.each(patterns, (pattern) => {
        let relDest;

        let globOpts = {
          cwd: baseDir
        };

        // From can be an object
        if (pattern.from.glob) {
          globOpts = _.extend(globOpts, _.omit(pattern.from, 'glob'));
          pattern.from = pattern.from.glob;
        }
        
        const relSrc = pattern.from;
        const absSrc = path.resolve(baseDir, relSrc);

        relDest = pattern.to || '';

        const forceWrite = Boolean(pattern.force);

        return fs
        .statAsync(absSrc)
        .catch(() => {
          return null;
        })
        .then((stat) => {
          if (stat && stat.isDirectory()) {
            contextDependencies.push(absSrc);

            // Make the relative destination actually relative
            if (path.isAbsolute(relDest)) {
              relDest = path.relative(baseDir, relDest);
            }

            return writeDirectoryToAssets({
              absDirSrc: absSrc,
              compilation,
              forceWrite,
              ignoreList,
              relDirDest: relDest
            });
          }

          return globAsync(relSrc, globOpts)
          .each((relFileSrc) => {

            let relFileDest;

            // Skip if it matches any of our ignore list
            if (shouldIgnore(relFileSrc, ignoreList)) {
              return;
            }

            const absFileSrc = path.resolve(baseDir, relFileSrc);

            relFileDest = pattern.to || '';

            const relFileDirname = path.dirname(relFileSrc);

            fileDependencies.push(absFileSrc);

            // If the pattern is a blob
            if (!stat) {
              // If the source is absolute
              if (path.isAbsolute(relFileSrc)) {
                // Make the destination relative
                relFileDest = path.join(path.relative(baseDir, relFileDirname), path.basename(relFileSrc));

              // If the source is relative
              } else {
                relFileDest = path.join(relFileDest, relFileSrc);
              }
            
            // If it's not a blob
            } else {
              // If it looks like a directory
              if (toLooksLikeDirectory(pattern)) {
                // Make the path relative to the source
                relFileDest = path.join(relFileDest, path.basename(relFileSrc));
              }
            }

            // If there's still no relFileDest
            relFileDest = relFileDest || path.basename(relFileSrc);

            // Make sure the relative destination is actually relative
            if (path.isAbsolute(relFileDest)) {
              relFileDest = path.relative(baseDir, relFileDest);
            }

            return writeFileToAssets({
              absFileSrc,
              compilation,
              forceWrite,
              relFileDest
            });
          });
        });
      })
      .catch((err) => {
        compilation.errors.push(err);
      })
      .finally(cb);
    });

    compiler.plugin('after-emit', (compilation, callback) => {
      const trackedFiles = compilation.fileDependencies;

      _.forEach(fileDependencies, (file) => {
        if (!_.includes(trackedFiles, file)) {
          trackedFiles.push(file);
        }
      });

      const trackedDirs = compilation.contextDependencies;

      _.forEach(contextDependencies, (context) => {
        if (!_.includes(trackedDirs, context)) {
          trackedDirs.push(context);
        }
      });

      callback();
    });
  };

  return {
    apply
  };
};
