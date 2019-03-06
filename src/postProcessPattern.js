import path from 'path';

import crypto from 'crypto';

import webpack from 'webpack';
import loaderUtils from 'loader-utils';
import cacache from 'cacache';
import serialize from 'serialize-javascript';
import findCacheDir from 'find-cache-dir';
import normalizePath from 'normalize-path';

import { name, version } from '../package.json';

import { stat, readFile } from './utils/promisify';

/* eslint-disable no-param-reassign */

export default function postProcessPattern(globalRef, pattern, file) {
  const {
    logger,
    compilation,
    fileDependencies,
    written,
    inputFileSystem,
    copyUnmodified,
  } = globalRef;

  const { outputOptions } = compilation;
  const { util } = webpack;

  logger.debug(`getting stats for '${file.absoluteFrom}' to write to assets`);

  return stat(inputFileSystem, file.absoluteFrom).then((stats) => {
    // We don't write empty directories
    if (stats.isDirectory()) {
      logger.debug(
        `skipping '${file.absoluteFrom}' because it is empty directory`
      );

      return Promise.resolve();
    }

    // If this came from a glob, add it to the file watchlist
    if (pattern.fromType === 'glob') {
      fileDependencies.add(file.absoluteFrom);
    }

    logger.debug(`reading '${file.absoluteFrom}' to write to assets`);

    return readFile(inputFileSystem, file.absoluteFrom)
      .then((content) => {
        if (pattern.transform) {
          logger.info(`transforming content for '${file.absoluteFrom}'`);

          // eslint-disable-next-line no-shadow
          const transform = (content, absoluteFrom) =>
            pattern.transform(content, absoluteFrom);

          if (pattern.cache) {
            if (!globalRef.cacheDir) {
              globalRef.cacheDir = findCacheDir({
                name: 'copy-webpack-plugin',
              });
            }

            const cacheKey = pattern.cache.key
              ? pattern.cache.key
              : serialize({
                  name,
                  version,
                  pattern,
                  hash: crypto
                    .createHash('md4')
                    .update(content)
                    .digest('hex'),
                });

            return cacache.get(globalRef.cacheDir, cacheKey).then(
              (result) => {
                logger.debug(
                  `getting cached transformation for '${file.absoluteFrom}'`
                );

                return result.data;
              },
              () =>
                Promise.resolve()
                  .then(() => transform(content, file.absoluteFrom))
                  // eslint-disable-next-line no-shadow
                  .then((content) => {
                    logger.debug(
                      `caching transformation for '${file.absoluteFrom}'`
                    );

                    return cacache
                      .put(globalRef.cacheDir, cacheKey, content)
                      .then(() => content);
                  })
            );
          }

          content = transform(content, file.absoluteFrom);
        }

        return content;
      })
      .then((content) => {
        if (pattern.toType === 'template') {
          logger.info(
            `interpolating template '${file.webpackTo}' for '${
              file.relativeFrom
            }'`
          );

          // If it doesn't have an extension, remove it from the pattern
          // ie. [name].[ext] or [name][ext] both become [name]
          if (!path.extname(file.relativeFrom)) {
            file.webpackTo = file.webpackTo.replace(/\.?\[ext\]/g, '');
          }

          // loaderUtils treats `hash` and `contenthash` as the same value.
          // However, we want `hash` to be the built-hash from webpack as
          // expected.
          const hash = util.createHash(outputOptions.hashFunction);
          file.webpackTo = file.webpackTo.replace(
            /\[hash(?::(\d+))?\]/gi,
            (all, maxLength) =>
              hash
                .digest(outputOptions.hashDigest)
                .substr(0, parseInt(maxLength, 10) || 9999)
          );

          // Developers can use invalid slashes in regex we should fix it
          file.webpackTo = normalizePath(
            loaderUtils.interpolateName(
              { resourcePath: file.absoluteFrom },
              file.webpackTo,
              {
                content,
                regExp: file.webpackToRegExp,
                context: pattern.context,
              }
            )
          );
        }

        return content;
      })
      .then((content) => {
        if (pattern.transformPath) {
          logger.info(
            `transforming path '${file.webpackTo}' for '${file.absoluteFrom}'`
          );

          return Promise.resolve(
            pattern.transformPath(file.webpackTo, file.absoluteFrom)
          )
            .then((newPath) => {
              // Developers can use invalid slashes we should fix it
              file.webpackTo = normalizePath(newPath);
            })
            .then(() => content);
        }

        return content;
      })
      .then((content) => {
        const hash = loaderUtils.getHashDigest(content);

        if (
          !copyUnmodified &&
          written[file.webpackTo] &&
          written[file.webpackTo][file.absoluteFrom] &&
          written[file.webpackTo][file.absoluteFrom] === hash
        ) {
          logger.info(
            `skipping '${file.webpackTo}', because content hasn't changed`
          );

          return;
        }

        logger.debug(`adding '${file.webpackTo}' for tracking content changes`);

        if (!written[file.webpackTo]) {
          written[file.webpackTo] = {};
        }

        written[file.webpackTo][file.absoluteFrom] = hash;

        if (compilation.assets[file.webpackTo] && !file.force) {
          logger.info(
            `skipping '${file.webpackTo}', because it already exists`
          );

          return;
        }

        logger.info(
          `writing '${file.webpackTo}' to compilation assets from '${
            file.absoluteFrom
          }'`
        );

        compilation.assets[file.webpackTo] = {
          size() {
            return stats.size;
          },
          source() {
            return content;
          },
        };
      });
  });
}
