import path from 'path';

import globby from 'globby';

import createPatternGlob from './utils/createPatternGlob';

/* eslint-disable no-param-reassign */

export default async function processPattern(globalRef, pattern) {
  const { logger, output, compilation } = globalRef;
  createPatternGlob(pattern, globalRef);

  logger.log(
    `begin globbing '${pattern.glob}' with a context of '${pattern.context}'`
  );

  const paths = await globby(pattern.glob, pattern.globOptions);

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
    paths.map((from) => {
      const file = {
        force: pattern.force,
        absoluteFrom: path.resolve(pattern.context, from),
      };

      file.relativeFrom = path.relative(pattern.context, file.absoluteFrom);

      if (pattern.flatten) {
        file.relativeFrom = path.basename(file.relativeFrom);
      }

      logger.debug(`found ${from}`);

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
  );
}
