import path from 'path';

import globby from 'globby';
import pLimit from 'p-limit';
import minimatch from 'minimatch';
import normalizePath from 'normalize-path';

import isObject from './utils/isObject';

export default function processPattern(globalRef, pattern) {
  const { logger, output, concurrency } = globalRef;
  const globOptions = Object.assign(
    {
      cwd: pattern.context,
      follow: true,
    },
    pattern.globOptions || {}
  );

  if (pattern.fromType === 'nonexistent') {
    return Promise.resolve();
  }

  const limit = pLimit(concurrency || 100);

  logger.info(
    `begin globbing '${pattern.glob}' with a context of '${pattern.context}'`
  );

  return globby(pattern.glob, globOptions).then((paths) =>
    Promise.all(
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

          // Ensure forward slashes
          file.relativeFrom = normalizePath(file.relativeFrom);

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
              logger.info(
                `ignoring '${
                  file.relativeFrom
                }', because it matches the ignore glob '${glob}'`
              );

              return Promise.resolve();
            }

            logger.debug(`${glob} doesn't match ${file.relativeFrom}`);
          }

          // Run ignore functions
          for (let i = 0; i < pattern.allIgnoreFunctions.length; i++) {
            logger.debug(
              `running ignore function against ${file.relativeFrom}`
            );
            if (
              pattern.allIgnoreFunctions[i]({
                absolutePath: file.absoluteFrom,
                relativePath: file.relativeFrom,
              })
            ) {
              return Promise.resolve();
            }
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
            if (output === '/') {
              const message =
                'using older versions of webpack-dev-server, devServer.outputPath must be defined to write to absolute paths';

              logger.error(message);

              throw new Error(message);
            }

            file.webpackTo = path.relative(output, file.webpackTo);
          }

          // Ensure forward slashes
          file.webpackTo = normalizePath(file.webpackTo);

          logger.info(
            `determined that '${from}' should write to '${file.webpackTo}'`
          );

          return file;
        })
      )
    )
  );
}
