import path from 'path';
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
        let fileDependencies;
        let contextDependencies;
        const written = {};

        let context;

        if (!options.context) {
            context = compiler.options.context;
        } else if (!path.isAbsolute(options.context)) {
            context = path.join(compiler.options.context, options.context);
        } else {
            context = options.context;
        }

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
                context,
                inputFileSystem: compiler.inputFileSystem,
                output: compiler.options.output.path,
                ignore: options.ignore || [],
                copyUnmodified: options.copyUnmodified,
                concurrency: options.concurrency,
                manifest: options.manifest || {}
            };

            if (globalRef.output === '/' &&
                compiler.options.devServer &&
                compiler.options.devServer.outputPath) {
                globalRef.output = compiler.options.devServer.outputPath;
            }

            const tasks = [];

            patterns.forEach((pattern) => {
                tasks.push(
                    Promise.resolve()
                    .then(() => preProcessPattern(globalRef, pattern))
                    // Every source (from) is assumed to exist here
                    .then((pattern) => processPattern(globalRef, pattern))
                );
            });

            Promise.all(tasks)
            .catch((err) => {
                compilation.errors.push(err);
            })
            .then(() => callback());
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
            fileDependencies.forEach((file) => {
                if (compilationFileDependencies.has(file)) {
                    debug(`not adding ${file} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${file} to change tracking`);
                    compilation.fileDependencies.push(file);
                }
            });

            // Add context dependencies if they're not already tracked
            contextDependencies.forEach((context) => {
                if (compilationContextDependencies.has(context)) {
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
