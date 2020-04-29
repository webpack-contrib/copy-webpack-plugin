import path from 'path';

import createPatternGlob from './utils/createPatternGlob';
import isTemplateLike from './utils/isTemplateLike';
import { stat } from './utils/promisify';

/* eslint-disable no-param-reassign */

export default function preProcessPattern(globalRef, pattern) {
  const { context, logger, inputFileSystem, compilation } = globalRef;

  pattern =
    typeof pattern === 'string'
      ? { from: pattern }
      : Object.assign({}, pattern);

  pattern.to = pattern.to || '';
  pattern.context = pattern.context || context;

  if (!path.isAbsolute(pattern.context)) {
    pattern.context = path.join(context, pattern.context);
  }

  // Todo remove this in next major
  const isToDirectory =
    path.extname(pattern.to) === '' || pattern.to.slice(-1) === path.sep;

  pattern.fromOrigin = pattern.from;
  pattern.from = path.normalize(pattern.from);
  pattern.context = path.normalize(pattern.context);
  pattern.to = path.normalize(pattern.to);

  pattern.ignore = globalRef.ignore.concat(pattern.ignore || []);

  logger.debug(`processing from: '${pattern.from}' to: '${pattern.to}'`);

  switch (true) {
    // if toType already exists
    case !!pattern.toType:
      break;
    case isTemplateLike(pattern.to):
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

  const noStatsHandler = (isFirstRun) => {
    if (
      isFirstRun ||
      pattern.fromType === 'glob' ||
      pattern.fromType === 'dir' ||
      pattern.fromType === 'file'
    ) {
      createPatternGlob(pattern, globalRef);
    } else {
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

      pattern.fromType = 'nonexistent';
    }
  };

  logger.debug(
    `getting stats for '${pattern.absoluteFrom}' to determinate 'fromType'`
  );

  return stat(inputFileSystem, pattern.absoluteFrom)
    .catch(() => noStatsHandler(true))
    .then((stats) => {
      if (!stats) {
        noStatsHandler();
        return pattern;
      }

      if (stats.isDirectory()) {
        pattern.fromType = 'dir';
        createPatternGlob(pattern, globalRef);
      } else if (stats.isFile()) {
        pattern.fromType = 'file';
        createPatternGlob(pattern, globalRef);
        pattern.stats = stats;
      } else if (!pattern.fromType) {
        logger.warn(`unrecognized file type for ${pattern.from}`);
      }

      return pattern;
    });
}
