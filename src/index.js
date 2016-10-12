import Promise from 'bluebird';
import _ from 'lodash';
import preProcessPattern from './preProcessPattern';
import processPattern from './processPattern';

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
        const fileDependencies = [];
        const contextDependencies = [];
        const written = {};

        compiler.plugin('emit', (compilation, cb) => {
            debug('starting emit');
            const callback = () => {
                debug('finishing emit');
                cb();
            };

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
                copyUnmodified: options.copyUnmodified
            };

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

            // Add file dependencies if they're not already tracked
            _.forEach(fileDependencies, (file) => {
                if (_.includes(compilation.fileDependencies, file)) {
                    debug(`not adding ${file} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${file} to change tracking`);
                    compilation.fileDependencies.push(file);
                }
            });

            // Add context dependencies if they're not already tracked
            _.forEach(contextDependencies, (context) => {
                if (_.includes(compilation.contextDependencies, context)) {
                    debug(`not adding ${context} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${context} to change tracking`);
                    compilation.contextDependencies.push(context);
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
