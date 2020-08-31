import webpack from 'webpack';
import validateOptions from 'schema-utils';
import pLimit from 'p-limit';

import schema from './options.json';
import preProcessPattern from './preProcessPattern';
import processPattern from './processPattern';
import postProcessPattern from './postProcessPattern';

// webpack 5 exposes the sources property to ensure the right version of webpack-sources is used
const { RawSource } =
  // eslint-disable-next-line global-require
  webpack.sources || require('webpack-sources');

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
    const pluginName = this.constructor.name;
    const limit = pLimit(this.options.concurrency || 100);

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
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

          let assets;

          try {
            assets = await Promise.all(
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
                    files
                      .filter(Boolean)
                      .map((file) =>
                        postProcessPattern(
                          globalRef,
                          patternAfterPreProcess,
                          file
                        )
                      )
                  );
                })
              )
            );
          } catch (error) {
            compilation.errors.push(error);

            callback();

            return;
          }

          // Avoid writing assets inside `p-limit`, because it creates concurrency.
          // It could potentially lead to an error - "Multiple assets emit different content to the same filename"
          assets
            .reduce((acc, val) => acc.concat(val), [])
            .filter(Boolean)
            .forEach((asset) => {
              const {
                absoluteFrom,
                targetPath,
                webpackTo,
                data,
                force,
              } = asset;

              const source = new RawSource(data);

              // For old version webpack 4
              /* istanbul ignore if */
              if (typeof compilation.emitAsset !== 'function') {
                // eslint-disable-next-line no-param-reassign
                compilation.assets[targetPath] = source;

                return;
              }

              const info = compilation.getAsset(targetPath);

              if (info) {
                if (force) {
                  logger.log(
                    `force updating '${webpackTo}' to compilation assets from '${absoluteFrom}'`
                  );

                  compilation.updateAsset(targetPath, source, { copied: true });

                  return;
                }

                logger.log(
                  `skipping '${webpackTo}', because it already exists`
                );

                return;
              }

              logger.log(
                `writing '${webpackTo}' to compilation assets from '${absoluteFrom}'`
              );

              compilation.emitAsset(targetPath, source, { copied: true });
            });

          logger.debug('end to adding additional assets');

          callback();
        }
      );

      if (compilation.hooks.statsPrinter) {
        compilation.hooks.statsPrinter.tap(pluginName, (stats) => {
          stats.hooks.print
            .for('asset.info.copied')
            .tap('copy-webpack-plugin', (copied, { green, formatFlag }) =>
              // eslint-disable-next-line no-undefined
              copied ? green(formatFlag('copied')) : undefined
            );
        });
      }
    });
  }
}

export default CopyPlugin;
