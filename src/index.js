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
        const dependencyIsTracked = compilation.fileDependencies.has(
          fileDependency
        );

        this.log(dependencyIsTracked, fileDependency, logger);

        if (!dependencyIsTracked) {
          compilation.fileDependencies.add(fileDependency);
        }
      }

      // Add context dependencies if they're not already tracked
      for (const contextDependency of contextDependencies) {
        const dependencyIsTracked = compilation.contextDependencies.has(
          contextDependency
        );

        this.log(dependencyIsTracked, contextDependency, logger);

        if (!dependencyIsTracked) {
          compilation.contextDependencies.add(contextDependency);
        }
      }

      logger.debug('finishing after-emit');

      callback();
    });
  }

  // eslint-disable-next-line
  log(dependencyIsTracked, dependency, logger) {
    let msg = `not adding '${dependency}' to change tracking`;

    // Just gonna rephrase the message as we intend
    msg = dependencyIsTracked
      ? (msg += `, because it's already tracked`)
      : msg.slice(3);

    logger.debug(msg);
  }
}

export default CopyPlugin;
