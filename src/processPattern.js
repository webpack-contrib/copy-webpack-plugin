import path from 'path';

import globby from 'globby';

import createPatternGlob from './utils/createPatternGlob';

export default async function processPattern(globalRef, pattern) {
  const { logger, output, compilation } = globalRef;

  createPatternGlob(pattern, globalRef);

  logger.log(
    `begin globbing '${pattern.glob}' with a context of '${pattern.context}'`
  );

  const paths = await globby(pattern.glob, pattern.globOptions);

  if (paths.length === 0) {
    if (pattern.noErrorOnMissing) {
      return Promise.resolve();
    }

    const missingError = new Error(
      `unable to locate '${pattern.from}' at '${pattern.absoluteFrom}'`
    );

    logger.error(missingError.message);

    compilation.errors.push(missingError);

    return Promise.resolve();
  }

  return (
    paths
      // Exclude directories
      .filter((item) => item.dirent.isFile())
      .map((item) => {
        const absoluteFrom = path.normalize(item.path);

        logger.debug(`found ${absoluteFrom}`);

        const file = {
          absoluteFrom,
          relativeFrom: pattern.flatten
            ? path.basename(absoluteFrom)
            : path.relative(pattern.context, absoluteFrom),
        };

        // Change the to path to be relative for webpack
        file.webpackTo =
          pattern.toType === 'dir'
            ? path.join(pattern.to, file.relativeFrom)
            : pattern.to;

        if (path.isAbsolute(file.webpackTo)) {
          file.webpackTo = path.relative(output, file.webpackTo);
        }

        // eslint-disable-next-line no-console
        console.log(file);

        logger.log(
          `determined that '${absoluteFrom}' should write to '${file.webpackTo}'`
        );

        return file;
      })
  );
}
