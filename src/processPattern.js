import path from 'path';

import globby from 'globby';
import pLimit from 'p-limit';
import isGlob from 'is-glob';
import minimatch from 'minimatch';

import isObject from './utils/isObject';

export default function processPattern(globalRef, pattern) {
  const { info, debug, output, concurrency, contextDependencies } = globalRef;
  const globArgs = Object.assign(
    {
      cwd: pattern.context,
    },
    pattern.fromArgs || {}
  );

  if (pattern.fromType === 'nonexistent') {
    return Promise.resolve();
  }

  const limit = pLimit(concurrency || 100);

  info(
    `begin globbing '${pattern.glob}' with a context of '${pattern.context}'`
  );

  return globby(pattern.glob, globArgs).then((paths) =>
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

          // This is so webpack is able to watch the directory and when
          // a new file is added it triggeres a rebuild
          const contextPath = path.dirname(path.resolve(from));

          if (
            contextDependencies.indexOf(contextPath) === -1 &&
            isGlob(pattern.glob)
          ) {
            contextDependencies.push(contextPath);
          }

          debug(`found ${from}`);

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

            debug(`testing ${glob} against ${file.relativeFrom}`);

            if (minimatch(file.relativeFrom, glob, globParams)) {
              info(
                `ignoring '${
                  file.relativeFrom
                }', because it matches the ignore glob '${glob}'`
              );

              return Promise.resolve();
            }

            debug(`${glob} doesn't match ${file.relativeFrom}`);
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
              // eslint-disable-next-line no-throw-literal
              throw '[copy-webpack-plugin] Using older versions of webpack-dev-server, devServer.outputPath must be defined to write to absolute paths';
            }

            file.webpackTo = path.relative(output, file.webpackTo);
          }

          // ensure forward slashes
          file.webpackTo = file.webpackTo.replace(/\\/g, '/');

          info(`determined that '${from}' should write to '${file.webpackTo}'`);

          return file;
        })
      )
    )
  );
}
