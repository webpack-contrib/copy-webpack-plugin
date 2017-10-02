import Promise from 'bluebird';
import _ from 'lodash';
import preProcessPattern from './preProcessPattern';
import processPattern from './processPattern';
import path from 'path';

const fs = Promise.promisifyAll(require('fs')); // eslint-disable-line import/no-commonjs
const constants = Promise.promisifyAll(require('constants')); // eslint-disable-line import/no-commonjs

function CopyWebpackPlugin(patterns = [], options = {}) {
    if (!Array.isArray(patterns)) {
        throw new Error('[copy-webpack-plugin] patterns must be an array');
    }

    // Defaults debug level to 'warning'
    options.debug = options.debug || 'warning';

    // Defaults debugging to info if only true is specified
    if (options.debug === true) {
        options.debug = 'info';
    }

    const debugLevels = ['warning', 'info', 'debug'];
    const debugLevelIndex = debugLevels.indexOf(options.debug);
    function log(msg, level) {
        if (level === 0) {
            msg = `WARNING - ${msg}`;
        } else {
            level = level || 1;
        }
        if (level <= debugLevelIndex) {
            console.log('[copy-webpack-plugin] ' + msg); // eslint-disable-line no-console
        }
    }

    function warning(msg) {
        log(msg, 0);
    }

    function info(msg) {
        log(msg, 1);
    }

    function debug(msg) {
        log(msg, 2);
    }

    const apply = (compiler) => {
        let fileDependencies;
        let contextDependencies;
        const written = {};

        compiler.plugin('emit', (compilation, cb) => {
            debug('starting emit');
            const callback = () => {
                debug('finishing emit');
                cb();
            };

            fileDependencies = [];
            contextDependencies = [];

            const globalRef = {
                info,
                debug,
                warning,
                compilation,
                written,
                fileDependencies,
                contextDependencies,
                context: compiler.options.context,
                output: compiler.options.output.path,
                ignore: options.ignore || [],
                copyUnmodified: options.copyUnmodified,
                concurrency: options.concurrency
            };

            if (globalRef.output === '/' &&
                compiler.options.devServer &&
                compiler.options.devServer.outputPath) {
                globalRef.output = compiler.options.devServer.outputPath;
            }

            Promise.each(patterns, (pattern) => {
                // Identify absolute source of each pattern and destination type
                return preProcessPattern(globalRef, pattern)
                .then((pattern) => {
                    // Every source (from) is assumed to exist here
                    return processPattern(globalRef, pattern);
                });
            })
            .catch((err) => {
                compilation.errors.push(err);
            })
            .finally(callback);
        });

        compiler.plugin('after-emit', (compilation, cb) => {
            debug('starting after-emit');
            const callback = () => {
                debug('finishing after-emit');
                cb();
            };

            const compilationFileDependencies = new Set(compilation.fileDependencies);
            const compilationContextDependencies = new Set(compilation.contextDependencies);

            // Add file dependencies if they're not already tracked
            _.forEach(fileDependencies, (file) => {
                if (compilationFileDependencies.has(file)) {
                    debug(`not adding ${file} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${file} to change tracking`);
                    compilation.fileDependencies.push(file);
                }
            });

            // Add context dependencies if they're not already tracked
            _.forEach(contextDependencies, (context) => {
                if (compilationContextDependencies.has(context)) {
                    debug(`not adding ${context} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${context} to change tracking`);
                    compilation.contextDependencies.push(context);
                }
            });

            // Copy permissions for files that requested it
            let output = compiler.options.output.path;
            if (output === '/' &&
                compiler.options.devServer &&
                compiler.options.devServer.outputPath) {
                output = compiler.options.devServer.outputPath;
            }

            _.forEach(written, function (value) {
                if (value.copyPermissions) {
                    debug(`restoring permissions to ${value.webpackTo}`);

                    let constsfrom = fs.constants || constants;

                    const mask = constsfrom.S_IRWXU | constsfrom.S_IRWXG | constsfrom.S_IRWXO;
                    fs.chmodSync(path.join(output, value.webpackTo), value.perms & mask);
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
