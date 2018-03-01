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

        const emit = (compilation, cb) => {
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
                concurrency: options.concurrency
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
        };

        const afterEmit = (compilation, cb) => {
            debug('starting after-emit');
            const callback = () => {
                debug('finishing after-emit');
                cb();
            };

            let compilationFileDependencies;
            let addFileDependency;
            if (Array.isArray(compilation.fileDependencies)) {
                compilationFileDependencies = new Set(compilation.fileDependencies);
                addFileDependency = (file) => compilation.fileDependencies.push(file);
            } else {
                compilationFileDependencies = compilation.fileDependencies;
                addFileDependency = (file) => compilation.fileDependencies.add(file);
            }

            let compilationContextDependencies;
            let addContextDependency;
            if (Array.isArray(compilation.contextDependencies)) {
                compilationContextDependencies = new Set(compilation.contextDependencies);
                addContextDependency = (file) => compilation.contextDependencies.push(file);
            } else {
                compilationContextDependencies = compilation.contextDependencies;
                addContextDependency = (file) => compilation.contextDependencies.add(file);
            }

            // Add file dependencies if they're not already tracked
            for (const file of fileDependencies) {
                if (compilationFileDependencies.has(file)) {
                    debug(`not adding ${file} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${file} to change tracking`);
                    addFileDependency(file);
                }
            }

            // Add context dependencies if they're not already tracked
            for (const context of contextDependencies) {
                if (compilationContextDependencies.has(context)) {
                    debug(`not adding ${context} to change tracking, because it's already tracked`);
                } else {
                    debug(`adding ${context} to change tracking`);
                    addContextDependency(context);
                }
            }

            callback();
        };

        if (compiler.hooks) {
            const plugin = { name: 'CopyPlugin' };

            compiler.hooks.emit.tapAsync(plugin, emit);
            compiler.hooks.afterEmit.tapAsync(plugin, afterEmit);
        } else {
            compiler.plugin('emit', emit);
            compiler.plugin('after-emit', afterEmit);
        }
    };

    return {
        apply
    };
}

CopyWebpackPlugin['default'] = CopyWebpackPlugin;
module.exports = CopyWebpackPlugin;
