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

function CopyWebpackPlugin(patterns = [], options = {}) {
    if (!_.isArray(patterns)) {
        throw new Error('CopyWebpackPlugin: patterns must be an array');
    }

    const apply = (compiler) => {
        const webpackContext = compiler.options.context;
        const outputPath = compiler.options.output.path;
        const fileDependencies = [];
        const contextDependencies = [];
        const webpackIgnore = options.ignore || [];
        const copyUnmodified = options.copyUnmodified;
        const writtenAssetHashes = {};

        compiler.plugin('emit', (compilation, cb) => {

            Promise.each(patterns, (pattern) => {
                let relDest;
                let globOpts;

                if (pattern.context && !path.isAbsolute(pattern.context)) {
                    pattern.context = path.resolve(webpackContext, pattern.context);
                }

                const context = pattern.context || webpackContext;
                const ignoreList = webpackIgnore.concat(pattern.ignore || []);

                globOpts = {
                    cwd: context
                };

                // From can be an object
                if (pattern.from.glob) {
                    globOpts = _.assignIn(globOpts, _.omit(pattern.from, 'glob'));
                    pattern.from = pattern.from.glob;
                }

                const relSrc = pattern.from;
                const absSrc = path.resolve(context, relSrc);

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
                                relDest = path.relative(outputPath, relDest);
                            }

                            return writeDirectoryToAssets({
                                absDirSrc: absSrc,
                                compilation,
                                copyUnmodified,
                                flatten: pattern.flatten,
                                forceWrite,
                                ignoreList,
                                relDirDest: relDest,
                                writtenAssetHashes
                            });
                        }

                        return globAsync(relSrc, globOpts)
                            .each((relFileSrcParam) => {
                                let relFileDest;
                                let relFileSrc;

                                relFileSrc = relFileSrcParam;

                                // Skip if it matches any of our ignore list
                                if (shouldIgnore(relFileSrc, ignoreList)) {
                                    return false;
                                }

                                const absFileSrc = path.resolve(context, relFileSrc);

                                relFileDest = pattern.to || '';

                                // Remove any directory references if flattening
                                if (pattern.flatten) {
                                    relFileSrc = path.basename(relFileSrc);
                                }

                                const relFileDirname = path.dirname(relFileSrc);

                                fileDependencies.push(absFileSrc);

                                // If the pattern is a blob
                                if (!stat) {
                                    // If the source is absolute
                                    if (path.isAbsolute(relFileSrc)) {
                                        // Make the destination relative
                                        relFileDest = path.join(path.relative(context, relFileDirname), path.basename(relFileSrc));

                                    // If the source is relative
                                    } else {
                                        relFileDest = path.join(relFileDest, relFileSrc);
                                    }

                                // If it looks like a directory
                                } else if (toLooksLikeDirectory(pattern)) {
                                    // Make the path relative to the source
                                    relFileDest = path.join(relFileDest, path.basename(relFileSrc));
                                }

                                // If there's still no relFileDest
                                relFileDest = relFileDest || path.basename(relFileSrc);

                                // Make sure the relative destination is actually relative
                                if (path.isAbsolute(relFileDest)) {
                                    relFileDest = path.relative(outputPath, relFileDest);
                                }

                                return writeFileToAssets({
                                    absFileSrc,
                                    compilation,
                                    copyUnmodified,
                                    forceWrite,
                                    relFileDest,
                                    writtenAssetHashes
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
}

CopyWebpackPlugin['default'] = CopyWebpackPlugin;
module.exports = CopyWebpackPlugin;
