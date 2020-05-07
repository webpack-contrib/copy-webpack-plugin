import validateOptions from 'schema-utils';

import schema from './options.json';
import preProcessPattern from './preProcessPattern';
import processPattern from './processPattern';
import postProcessPattern from './postProcessPattern';

class CopyPlugin {
  constructor(options = {}) {
    validateOptions(schema, options, {
      name: 'Copy Plugin',
      baseDataPath: 'options',
    });

    this.patterns = options.patterns;
    this.options = options.options || {};
  }

  apply(compiler) {
    const fileDependencies = new Set();
    const contextDependencies = new Set();
    const plugin = { name: 'CopyPlugin' };

    compiler.hooks.compilation.tap(plugin, (compilation) => {
      const logger = compilation.getLogger('copy-webpack-plugin');

      compilation.hooks.additionalAssets.tapAsync(
        'copy-webpack-plugin',
        (callback) => {
          logger.debug('starting emit');

          const globalRef = {
            context: compiler.options.context,
            logger,
            compilation,
            fileDependencies,
            contextDependencies,
            inputFileSystem: compiler.inputFileSystem,
            output: compiler.options.output.path,
            ignore: this.options.ignore || [],
            concurrency: this.options.concurrency,
          };

          Promise.all(
            this.patterns.map((pattern) =>
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
                        .map((file) =>
                          postProcessPattern(globalRef, pattern, file)
                        )
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
        }
      );
    });

    compiler.hooks.afterEmit.tapAsync(plugin, (compilation, callback) => {
      const logger = compilation.getLogger('copy-webpack-plugin');

      logger.debug('starting after-emit');

      // Add file dependencies
      if ('addAll' in compilation.fileDependencies) {
        compilation.fileDependencies.addAll(fileDependencies);
      } else {
        for (const fileDependency of fileDependencies) {
          compilation.fileDependencies.add(fileDependency);
        }
      }

      // Add context dependencies
      if ('addAll' in compilation.contextDependencies) {
        compilation.contextDependencies.addAll(contextDependencies);
      } else {
        for (const contextDependency of contextDependencies) {
          compilation.contextDependencies.add(contextDependency);
        }
      }

      logger.debug('finishing after-emit');

      callback();
    });
  }
}

export default CopyPlugin;
