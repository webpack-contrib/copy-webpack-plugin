import path from 'path';

import preProcessPattern from './preProcessPattern';
import processPattern from './processPattern';
import postProcessPattern from './postProcessPattern';

class CopyPlugin {
  constructor(patterns = [], options = {}) {
    if (!Array.isArray(patterns)) {
      throw new Error('[copy-webpack-plugin] patterns must be an array');
    }

    this.patterns = patterns;
    this.options = options;
  }

  apply(compiler) {
    // Defaults debug level to 'warning'
    // eslint-disable-next-line no-param-reassign
    this.options.debug = this.options.debug || 'warning';

    // Defaults debugging to info if only true is specified
    if (this.options.debug === true) {
      // eslint-disable-next-line no-param-reassign
      this.options.debug = 'info';
    }

    const debugLevels = ['warning', 'info', 'debug'];
    const debugLevelIndex = debugLevels.indexOf(this.options.debug);

    function log(msg, level) {
      if (level === 0) {
        // eslint-disable-next-line no-param-reassign
        msg = `WARNING - ${msg}`;
      } else {
        // eslint-disable-next-line no-param-reassign
        level = level || 1;
      }

      if (level <= debugLevelIndex) {
        console.log(`[copy-webpack-plugin] ${msg}`); // eslint-disable-line no-console
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

    const fileDependencies = [];
    const contextDependencies = [];
    const written = {};

    let context;

    if (!this.options.context) {
      ({ context } = compiler.options);
    } else if (!path.isAbsolute(this.options.context)) {
      context = path.join(compiler.options.context, this.options.context);
    } else {
      ({ context } = this.options);
    }

    const plugin = { name: 'CopyPlugin' };

    compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
      debug('starting emit');

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
        ignore: this.options.ignore || [],
        copyUnmodified: this.options.copyUnmodified,
        concurrency: this.options.concurrency,
      };

      if (
        globalRef.output === '/' &&
        compiler.options.devServer &&
        compiler.options.devServer.outputPath
      ) {
        globalRef.output = compiler.options.devServer.outputPath;
      }

      const { patterns } = this;

      Promise.all(
        patterns.map((pattern) =>
          Promise.resolve()
            .then(() => preProcessPattern(globalRef, pattern))
            // Every source (from) is assumed to exist here
            // eslint-disable-next-line no-shadow
            .then((pattern) =>
              processPattern(globalRef, pattern).then((files) => {
                if (!files) {
                  return Promise.resolve();
                }

                return Promise.all(
                  files
                    .filter(Boolean)
                    .map((file) => postProcessPattern(globalRef, pattern, file))
                );
              })
            )
        )
      )
        .catch((error) => {
          compilation.errors.push(error);
        })
        .then(() => {
          debug('finishing emit');

          callback();
        });
    });
    compiler.hooks.afterEmit.tapAsync(plugin, (compilation, callback) => {
      debug('starting after-emit');

      // Add file dependencies if they're not already tracked
      for (const fileDependency of fileDependencies) {
        if (compilation.fileDependencies.has(fileDependency)) {
          debug(
            `not adding ${fileDependency} to change tracking, because it's already tracked`
          );
        } else {
          debug(`adding ${fileDependency} to change tracking`);

          compilation.fileDependencies.add(fileDependency);
        }
      }

      // Add context dependencies if they're not already tracked
      for (const contextDependency of contextDependencies) {
        if (compilation.contextDependencies.has(contextDependency)) {
          debug(
            `not adding ${contextDependency} to change tracking, because it's already tracked`
          );
        } else {
          debug(`adding ${contextDependency} to change tracking`);

          compilation.contextDependencies.add(contextDependency);
        }
      }

      debug('finishing after-emit');

      callback();
    });
  }
}

export default CopyPlugin;
