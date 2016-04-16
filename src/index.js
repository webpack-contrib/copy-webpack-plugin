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

const union = (set1, set2) => {
    return new Set([...set1, ...set2]);
};

const isDevServer = (compiler) => {
    return compiler.outputFileSystem.constructor.name === 'MemoryFileSystem';
};

const getOutputDir = (compiler) => {
    if (compiler.options.output.path && compiler.options.output.path !== '/') {
        return compiler.options.output.path;
    }

    const outputPath = compiler.options.devServer.outputPath;

    if (!outputPath || outputPath === '/') {
        throw new Error('CopyWebpackPlugin: to use webpack-dev-server, devServer.outputPath must be defined in the webpack config');
    }

    return outputPath;
};

export default (patterns = [], options = {}) => {
    if (!_.isArray(patterns)) {
        throw new Error('CopyWebpackPlugin: patterns must be an array');
    }

    const apply = (compiler) => {
        const webpackContext = compiler.options.context;
        const outputPath = getOutputDir(compiler);
        const fileDependencies = [];
        const contextDependencies = [];
        const ignoreList = options.ignore;
        const copyUnmodified = options.copyUnmodified;
        let writtenAssets;
        let lastGlobalUpdate;

        lastGlobalUpdate = 0;

        compiler.plugin('emit', (compilation, cb) => {
            writtenAssets = new Set();

            Promise.each(patterns, (pattern) => {
                let relDest;
                let globOpts;
                let context;

                if (pattern.context && !path.isAbsolute(pattern.context)) {
                    pattern.context = path.resolve(webpackContext, pattern.context);
                }
                
                context = pattern.context || webpackContext;

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
                                lastGlobalUpdate,
                                relDirDest: relDest
                            })
                            .then((assets) => {
                                writtenAssets = union(writtenAssets, assets);
                            });
                        }

                        return globAsync(relSrc, globOpts)
                            .each((relFileSrc) => {
                                let relFileDest;

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
                                    lastGlobalUpdate,
                                    relFileDest
                                })
                                .then((asset) => {
                                    writtenAssets.add(asset);
                                });
                            });
                    });
            })
            .then(() => {
                lastGlobalUpdate = _.now();
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

            // Write files to file system if webpack-dev-server

            if (!isDevServer(compiler)) {
                callback();

                return;
            }

            const writeFilePromises = [];

            _.forEach(compilation.assets, (asset, assetPath) => {
                // If this is not our asset, ignore it
                if (!writtenAssets.has(assetPath)) {
                    return;
                }

                const outputFilePath = path.join(outputPath, assetPath);
                const absOutputPath = path.resolve(process.cwd(), outputFilePath);

                writeFilePromises.push(fs.mkdirsAsync(path.dirname(absOutputPath))
                    .then(() => {
                        return fs.writeFileAsync(absOutputPath, asset.source());
                    }));
            });

            Promise.all(writeFilePromises)
                .then(() => {
                    callback();
                });
        });
    };

    return {
        apply
    };
};
