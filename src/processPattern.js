import path from 'path';

import globby from 'globby';
import pLimit from 'p-limit';
import minimatch from 'minimatch';

import isObject from './utils/isObject';
import createPatternGlob from './utils/createPatternGlob';

/* eslint-disable no-param-reassign */

export default function processPattern(globalRef, pattern) {
  const { logger, output, concurrency, compilation } = globalRef;
  createPatternGlob(pattern, globalRef);

  const limit = pLimit(concurrency || 100);

  logger.log(
    `begin globbing '${pattern.glob}' with a context of '${pattern.context}'`
  );

  return globby(pattern.glob, pattern.globOptions).then((paths) => {
    if (paths.length === 0) {
      const newWarning = new Error(
        `unable to locate '${pattern.from}' at '${pattern.absoluteFrom}'`
      );
      const hasWarning = compilation.warnings.some(
        // eslint-disable-next-line no-shadow
        (warning) => warning.message === newWarning.message
      );

      // Only display the same message once
      if (!hasWarning) {
        logger.warn(newWarning.message);

        compilation.warnings.push(newWarning);
      }

      return Promise.resolve();
    }
    return Promise.all(
      paths.map((from) =>
        limit(() => {
          const file = {
            force: pattern.force,
            absoluteFrom: path.resolve(pattern.context, from),
          };

          file.relativeFrom = path.relative(pattern.context, file.absoluteFrom);

          if (pattern.flatten) {
            file.relativeFrom = path.basename(file.relativeFrom);
          }

          logger.debug(`found ${from}`);

          // Check the ignore list
          let il = pattern.ignore.length;

          // eslint-disable-next-line no-plusplus
          while (il--) {
            const ignoreGlob = pattern.ignore[il];

            let globParams = {
              dot: true,
              matchBase: true,
            };

            let glob;

            if (typeof ignoreGlob === 'string') {
              glob = ignoreGlob;
            } else if (isObject(ignoreGlob)) {
              glob = ignoreGlob.glob || '';

              const ignoreGlobParams = Object.assign({}, ignoreGlob);
              delete ignoreGlobParams.glob;

              // Overwrite minimatch defaults
              globParams = Object.assign(globParams, ignoreGlobParams);
            } else {
              glob = '';
            }

            logger.debug(`testing ${glob} against ${file.relativeFrom}`);

            if (minimatch(file.relativeFrom, glob, globParams)) {
              logger.log(
                `ignoring '${file.relativeFrom}', because it matches the ignore glob '${glob}'`
              );

              return Promise.resolve();
            }

            logger.debug(`${glob} doesn't match ${file.relativeFrom}`);
          }

          // Change the to path to be relative for webpack
          if (pattern.toType === 'dir') {
            file.webpackTo = path.join(pattern.to, file.relativeFrom);
          } else if (pattern.toType === 'file') {
            file.webpackTo = pattern.to || file.relativeFrom;
          } else if (pattern.toType === 'template') {
            file.webpackTo = pattern.to;
            file.webpackToRegExp = pattern.test;
          }

          if (path.isAbsolute(file.webpackTo)) {
            file.webpackTo = path.relative(output, file.webpackTo);
          }

          logger.log(
            `determined that '${from}' should write to '${file.webpackTo}'`
          );

          return file;
        })
      )
    );
  });
}
