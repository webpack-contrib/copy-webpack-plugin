import path from 'path';

import log from 'webpack-log';

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
    const fileDependencies = new Set();
    const contextDependencies = new Set();
    const written = {};

    let context;

    if (!this.options.context) {
      ({ context } = compiler.options);
    } else if (!path.isAbsolute(this.options.context)) {
      context = path.join(compiler.options.context, this.options.context);
    } else {
      ({ context } = this.options);
    }

    const logger = log({
      name: 'copy-webpack-plugin',
      level: this.options.logLevel || 'warn',
    });

    const plugin = { name: 'CopyPlugin' };

    compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
      logger.debug('starting emit');

      const globalRef = {
        logger,
        compilation,
        written,
        fileDependencies,
        contextDependencies,
        context,
        inputFileSystem: compiler.inputFileSystem,
        output: compiler.options.output.path,
        ignore: this.options.ignore || [],
        ignoreFiles: options.ignoreFiles || null,
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
          logger.debug('finishing emit');

          callback();
        });
    });
    compiler.hooks.afterEmit.tapAsync(plugin, (compilation, callback) => {
      logger.debug('starting after-emit');

      // Add file dependencies if they're not already tracked
      for (const fileDependency of fileDependencies) {
        if (compilation.fileDependencies.has(fileDependency)) {
          logger.debug(
            `not adding '${fileDependency}' to change tracking, because it's already tracked`
          );
        } else {
          logger.debug(`adding '${fileDependency}' to change tracking`);

          compilation.fileDependencies.add(fileDependency);
        }
      }

      // Add context dependencies if they're not already tracked
      for (const contextDependency of contextDependencies) {
        if (compilation.contextDependencies.has(contextDependency)) {
          logger.debug(
            `not adding '${contextDependency}' to change tracking, because it's already tracked`
          );
        } else {
          logger.debug(`adding '${contextDependency}' to change tracking`);

          compilation.contextDependencies.add(contextDependency);
        }
      }

      logger.debug('finishing after-emit');

      callback();
    });
  }
}

export default CopyPlugin;
