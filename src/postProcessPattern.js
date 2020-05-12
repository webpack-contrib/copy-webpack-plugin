import path from 'path';
import os from 'os';
import crypto from 'crypto';

import loaderUtils from 'loader-utils';
import cacache from 'cacache';
import serialize from 'serialize-javascript';
import findCacheDir from 'find-cache-dir';
import normalizePath from 'normalize-path';

import { name, version } from '../package.json';

import { stat, readFile } from './utils/promisify';

/* eslint-disable no-param-reassign */

export default async function postProcessPattern(globalRef, pattern, file) {
  const { logger, compilation, inputFileSystem } = globalRef;

  logger.debug(`getting stats for '${file.absoluteFrom}' to write to assets`);

  try {
    const getStats = pattern.stats
      ? Promise.resolve().then(() => pattern.stats)
      : stat(inputFileSystem, file.absoluteFrom);

    const stats = await getStats;

    if (stats.isDirectory()) {
      logger.debug(
        `skipping '${file.absoluteFrom}' because it is empty directory`
      );
    }

    // If this came from a glob, add it to the file watchlist
    if (pattern.fromType === 'glob') {
      logger.debug(`add ${file.absoluteFrom} as fileDependencies`);
      compilation.fileDependencies.add(file.absoluteFrom);
    }

    logger.debug(`reading '${file.absoluteFrom}' to write to assets`);

    let content = await readFile(inputFileSystem, file.absoluteFrom);

    if (pattern.transform) {
      logger.log(`transforming content for '${file.absoluteFrom}'`);

      // eslint-disable-next-line no-shadow
      const transform = (content, absoluteFrom) =>
        pattern.transform(content, absoluteFrom);

      if (pattern.cacheTransform) {
        if (!globalRef.cacheDir) {
          globalRef.cacheDir =
            findCacheDir({ name: 'copy-webpack-plugin' }) || os.tmpdir();
        }

        const cacheKey = pattern.cacheTransform.key
          ? pattern.cacheTransform.key
          : serialize({
              name,
              version,
              pattern,
              hash: crypto.createHash('md4').update(content).digest('hex'),
            });

        try {
          const result = await cacache.get(globalRef.cacheDir, cacheKey);

          logger.debug(
            `getting cached transformation for '${file.absoluteFrom}'`
          );

          content = await result.data;
        } catch (e) {
          content = await transform(content, file.absoluteFrom);

          logger.debug(`caching transformation for '${file.absoluteFrom}'`);

          content = await cacache
            .put(globalRef.cacheDir, cacheKey, content)
            .then(() => content);
        }
      } else {
        content = await transform(content, file.absoluteFrom);
      }
    }

    if (pattern.toType === 'template') {
      logger.log(
        `interpolating template '${file.webpackTo}' for '${file.relativeFrom}'`
      );

      // If it doesn't have an extension, remove it from the pattern
      // ie. [name].[ext] or [name][ext] both become [name]
      if (!path.extname(file.relativeFrom)) {
        file.webpackTo = file.webpackTo.replace(/\.?\[ext\]/g, '');
      }

      file.webpackTo = loaderUtils.interpolateName(
        { resourcePath: file.absoluteFrom },
        file.webpackTo,
        {
          content,
          regExp: file.webpackToRegExp,
          context: pattern.context,
        }
      );

      // Bug in `loader-utils`, package convert `\\` to `/`, need fix in loader-utils
      file.webpackTo = path.normalize(file.webpackTo);
    }

    if (pattern.transformPath) {
      logger.log(
        `transforming path '${file.webpackTo}' for '${file.absoluteFrom}'`
      );

      file.webpackTo = await pattern.transformPath(
        file.webpackTo,
        file.absoluteFrom
      );
    }

    const targetPath = normalizePath(file.webpackTo);

    if (compilation.assets[targetPath] && !file.force) {
      logger.log(`skipping '${file.webpackTo}', because it already exists`);

      return;
    }

    logger.log(
      `writing '${file.webpackTo}' to compilation assets from '${file.absoluteFrom}'`
    );

    compilation.assets[targetPath] = {
      size() {
        return stats.size;
      },
      source() {
        return content;
      },
    };
  } catch (error) {
    throw error;
  }
}
