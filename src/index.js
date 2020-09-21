import path from 'path';
import os from 'os';
import crypto from 'crypto';

import webpack from 'webpack';
import validateOptions from 'schema-utils';
import pLimit from 'p-limit';
import globby from 'globby';
import findCacheDir from 'find-cache-dir';
import serialize from 'serialize-javascript';
import cacache from 'cacache';
import loaderUtils from 'loader-utils';
import normalizePath from 'normalize-path';

import { version } from '../package.json';

import schema from './options.json';
import { readFile, stat } from './utils/promisify';
import createPatternGlob from './utils/createPatternGlob';

// webpack 5 exposes the sources property to ensure the right version of webpack-sources is used
const { RawSource } =
  // eslint-disable-next-line global-require
  webpack.sources || require('webpack-sources');

const template = /(\[ext\])|(\[name\])|(\[path\])|(\[folder\])|(\[emoji(?::(\d+))?\])|(\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\])|(\[\d+\])/;

class CopyPlugin {
  constructor(options = {}) {
    validateOptions(schema, options, {
      name: 'Copy Plugin',
      baseDataPath: 'options',
    });

    this.patterns = options.patterns;
    this.options = options.options || {};
  }

  // eslint-disable-next-line class-methods-use-this
  async runPattern(compiler, compilation, logger, inputPattern) {
    const pattern =
      typeof inputPattern === 'string'
        ? { from: inputPattern }
        : { ...inputPattern };

    pattern.fromOrigin = pattern.from;
    pattern.from = path.normalize(pattern.from);
    pattern.to = path.normalize(
      typeof pattern.to !== 'undefined' ? pattern.to : ''
    );

    pattern.context = path.normalize(
      typeof pattern.context !== 'undefined'
        ? !path.isAbsolute(pattern.context)
          ? path.join(compiler.options.context, pattern.context)
          : pattern.context
        : compiler.options.context
    );

    logger.debug(`processing from "${pattern.from}" to "${pattern.to}"`);

    const isToDirectory =
      path.extname(pattern.to) === '' || pattern.to.slice(-1) === path.sep;

    switch (true) {
      // if toType already exists
      case !!pattern.toType:
        break;
      case template.test(pattern.to):
        pattern.toType = 'template';
        break;
      case isToDirectory:
        pattern.toType = 'dir';
        break;
      default:
        pattern.toType = 'file';
    }

    if (path.isAbsolute(pattern.from)) {
      pattern.absoluteFrom = pattern.from;
    } else {
      pattern.absoluteFrom = path.resolve(pattern.context, pattern.from);
    }

    logger.debug(
      `getting stats for "${pattern.absoluteFrom}" to determinate "fromType"`
    );

    let stats;

    try {
      stats = await stat(compiler.inputFileSystem, pattern.absoluteFrom);
    } catch (error) {
      // Nothing
    }

    if (stats) {
      if (stats.isDirectory()) {
        pattern.fromType = 'dir';
      } else if (stats.isFile()) {
        pattern.fromType = 'file';
      }
    }

    createPatternGlob(pattern, { logger, compilation });

    logger.log(
      `begin globbing "${pattern.glob}" with a context of "${pattern.context}"`
    );

    const paths = await globby(pattern.glob, pattern.globOptions);

    if (paths.length === 0) {
      if (pattern.noErrorOnMissing) {
        return Promise.resolve();
      }

      const missingError = new Error(
        `unable to locate "${pattern.from}" at "${pattern.absoluteFrom}"`
      );

      logger.error(missingError.message);

      compilation.errors.push(missingError);

      return Promise.resolve();
    }

    const filteredPaths = (
      await Promise.all(
        paths.map(async (item) => {
          // Exclude directories
          if (!item.dirent.isFile()) {
            return false;
          }

          if (pattern.filter) {
            const isFiltered = await pattern.filter(item.path);

            return isFiltered ? item : false;
          }

          return item;
        })
      )
    ).filter((item) => item);

    if (filteredPaths.length === 0) {
      return Promise.resolve();
    }

    const files = filteredPaths.map((item) => {
      const from = item.path;

      logger.debug(`found "${from}"`);

      // `globby`/`fast-glob` return the relative path when the path contains special characters on windows
      const absoluteFrom = path.resolve(pattern.context, from);
      const relativeFrom = pattern.flatten
        ? path.basename(absoluteFrom)
        : path.relative(pattern.context, absoluteFrom);
      let webpackTo =
        pattern.toType === 'dir'
          ? path.join(pattern.to, relativeFrom)
          : pattern.to;

      if (path.isAbsolute(webpackTo)) {
        webpackTo = path.relative(compiler.options.output.path, webpackTo);
      }

      logger.log(`determined that "${from}" should write to "${webpackTo}"`);

      return { absoluteFrom, relativeFrom, webpackTo };
    });

    return Promise.all(
      files.map(async (file) => {
        // If this came from a glob, add it to the file watchlist
        if (pattern.fromType === 'glob') {
          logger.debug(`add ${file.absoluteFrom} as fileDependencies`);

          compilation.fileDependencies.add(file.absoluteFrom);
        }

        logger.debug(`reading "${file.absoluteFrom}" to write to assets`);

        let data;

        try {
          data = await readFile(compiler.inputFileSystem, file.absoluteFrom);
        } catch (error) {
          compilation.errors.push(error);

          return;
        }

        if (pattern.transform) {
          logger.log(`transforming content for "${file.absoluteFrom}"`);

          if (pattern.cacheTransform) {
            const cacheDirectory = pattern.cacheTransform.directory
              ? pattern.cacheTransform.directory
              : typeof pattern.cacheTransform === 'string'
              ? pattern.cacheTransform
              : findCacheDir({ name: 'copy-webpack-plugin' }) || os.tmpdir();
            let defaultCacheKeys = {
              version,
              transform: pattern.transform,
              contentHash: crypto.createHash('md4').update(data).digest('hex'),
            };

            if (typeof pattern.cacheTransform.keys === 'function') {
              defaultCacheKeys = await pattern.cacheTransform.keys(
                defaultCacheKeys,
                file.absoluteFrom
              );
            } else {
              defaultCacheKeys = {
                ...defaultCacheKeys,
                ...pattern.cacheTransform.keys,
              };
            }

            const cacheKeys = serialize(defaultCacheKeys);

            try {
              const result = await cacache.get(cacheDirectory, cacheKeys);

              logger.debug(
                `getting cached transformation for "${file.absoluteFrom}"`
              );

              ({ data } = result);
            } catch (_ignoreError) {
              data = await pattern.transform(data, file.absoluteFrom);

              logger.debug(`caching transformation for "${file.absoluteFrom}"`);

              await cacache.put(cacheDirectory, cacheKeys, data);
            }
          } else {
            data = await pattern.transform(data, file.absoluteFrom);
          }
        }

        if (pattern.toType === 'template') {
          logger.log(
            `interpolating template "${file.webpackTo}" for "${file.relativeFrom}"`
          );

          // If it doesn't have an extension, remove it from the pattern
          // ie. [name].[ext] or [name][ext] both become [name]
          if (!path.extname(file.relativeFrom)) {
            // eslint-disable-next-line no-param-reassign
            file.webpackTo = file.webpackTo.replace(/\.?\[ext]/g, '');
          }

          // eslint-disable-next-line no-param-reassign
          file.immutable = /\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi.test(
            file.webpackTo
          );

          // eslint-disable-next-line no-param-reassign
          file.webpackTo = loaderUtils.interpolateName(
            { resourcePath: file.absoluteFrom },
            file.webpackTo,
            {
              content: data,
              context: pattern.context,
            }
          );

          // Bug in `loader-utils`, package convert `\\` to `/`, need fix in loader-utils
          // eslint-disable-next-line no-param-reassign
          file.webpackTo = path.normalize(file.webpackTo);
        }

        if (pattern.transformPath) {
          logger.log(
            `transforming path "${file.webpackTo}" for "${file.absoluteFrom}"`
          );

          // eslint-disable-next-line no-param-reassign
          file.immutable = false;
          // eslint-disable-next-line no-param-reassign
          file.webpackTo = await pattern.transformPath(
            file.webpackTo,
            file.absoluteFrom
          );
        }

        // eslint-disable-next-line no-param-reassign
        file.data = data;
        // eslint-disable-next-line no-param-reassign
        file.targetPath = normalizePath(file.webpackTo);
        // eslint-disable-next-line no-param-reassign
        file.force = pattern.force;

        // eslint-disable-next-line consistent-return
        return file;
      })
    );
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

          let assets;

          try {
            assets = await Promise.all(
              this.patterns.map((item) =>
                limit(async () =>
                  this.runPattern(compiler, compilation, logger, item)
                )
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

              const existingAsset = compilation.getAsset(targetPath);

              if (existingAsset) {
                if (force) {
                  logger.log(
                    `force updating "${webpackTo}" to compilation assets from "${absoluteFrom}"`
                  );

                  const info = { copied: true };

                  if (asset.immutable) {
                    info.immutable = true;
                  }

                  compilation.updateAsset(targetPath, source, info);

                  return;
                }

                logger.log(
                  `skipping "${webpackTo}", because it already exists`
                );

                return;
              }

              logger.log(
                `writing "${webpackTo}" to compilation assets from "${absoluteFrom}"`
              );

              const info = { copied: true };

              if (asset.immutable) {
                info.immutable = true;
              }

              compilation.emitAsset(targetPath, source, info);
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
