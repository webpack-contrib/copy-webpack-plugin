import validateOptions from 'schema-utils';
import pLimit from 'p-limit';

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
    const plugin = { name: 'CopyPlugin' };
    const limit = pLimit(this.options.concurrency || 100);

    compiler.hooks.compilation.tap(plugin, (compilation) => {
      const logger = compilation.getLogger('copy-webpack-plugin');

      compilation.hooks.additionalAssets.tapAsync(
        'copy-webpack-plugin',
        async (callback) => {
          logger.debug('start to adding additional assets');

          const globalRef = {
            context: compiler.options.context,
            logger,
            compilation,
            inputFileSystem: compiler.inputFileSystem,
            output: compiler.options.output.path,
          };

          try {
            await Promise.all(
              this.patterns.map((pattern) =>
                limit(async () => {
                  const patternAfterPreProcess = await preProcessPattern(
                    globalRef,
                    pattern
                  );

                  const files = await processPattern(
                    globalRef,
                    patternAfterPreProcess
                  );

                  if (!files) {
                    return Promise.resolve();
                  }

                  return Promise.all(
                    files.filter(Boolean).map((file) =>
                      limit(() => {
                        return postProcessPattern(
                          globalRef,
                          patternAfterPreProcess,
                          file
                        );
                      })
                    )
                  );
                })
              )
            );

            logger.debug('end to adding additional assets');

            callback();
          } catch (error) {
            compilation.errors.push(error);
            callback();
          }
        }
      );
    });
  }
}

export default CopyPlugin;
