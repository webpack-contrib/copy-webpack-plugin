import path from 'path';
import os from 'os';
import crypto from 'crypto';

import loaderUtils from 'loader-utils';
import cacache from 'cacache';
import serialize from 'serialize-javascript';
import findCacheDir from 'find-cache-dir';
import normalizePath from 'normalize-path';

import { version } from '../package.json';

import { readFile } from './utils/promisify';

/* eslint-disable no-param-reassign */
export default async function postProcessPattern(globalRef, pattern, file) {
  const { logger, compilation, inputFileSystem } = globalRef;

  // If this came from a glob, add it to the file watchlist
  if (pattern.fromType === 'glob') {
    logger.debug(`add ${file.absoluteFrom} as fileDependencies`);

    compilation.fileDependencies.add(file.absoluteFrom);
  }

  logger.debug(`reading '${file.absoluteFrom}' to write to assets`);

  let data;

  try {
    data = await readFile(inputFileSystem, file.absoluteFrom);
  } catch (error) {
    compilation.errors.push(error);

    return;
  }

  if (pattern.transform) {
    logger.log(`transforming content for '${file.absoluteFrom}'`);

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
          `getting cached transformation for '${file.absoluteFrom}'`
        );

        ({ data } = result);
      } catch (_ignoreError) {
        data = await pattern.transform(data, file.absoluteFrom);

        logger.debug(`caching transformation for '${file.absoluteFrom}'`);

        await cacache.put(cacheDirectory, cacheKeys, data);
      }
    } else {
      data = await pattern.transform(data, file.absoluteFrom);
    }
  }

  if (pattern.toType === 'template') {
    logger.log(
      `interpolating template '${file.webpackTo}' for '${file.relativeFrom}'`
    );

    // If it doesn't have an extension, remove it from the pattern
    // ie. [name].[ext] or [name][ext] both become [name]
    if (!path.extname(file.relativeFrom)) {
      file.webpackTo = file.webpackTo.replace(/\.?\[ext]/g, '');
    }

    file.webpackTo = loaderUtils.interpolateName(
      { resourcePath: file.absoluteFrom },
      file.webpackTo,
      {
        content: data,
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

  file.data = data;
  file.targetPath = normalizePath(file.webpackTo);
  file.force = pattern.force;

  // eslint-disable-next-line consistent-return
  return file;
}
