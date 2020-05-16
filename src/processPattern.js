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
        const from = item.path;

        logger.debug(`found ${from}`);

        const absoluteFrom = path.resolve(pattern.context, from);
        const relativeFrom = pattern.flatten
          ? path.basename(absoluteFrom)
          : path.relative(pattern.context, absoluteFrom);
        let webpackTo =
          pattern.toType === 'dir'
            ? path.join(pattern.to, relativeFrom)
            : pattern.to;

        if (path.isAbsolute(webpackTo)) {
          webpackTo = path.relative(output, webpackTo);
        }

        logger.log(`determined that '${from}' should write to '${webpackTo}'`);

        return { absoluteFrom, relativeFrom, webpackTo };
      })
  );
}
