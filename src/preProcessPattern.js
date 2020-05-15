import path from 'path';

import isTemplateLike from './utils/isTemplateLike';
import { stat } from './utils/promisify';

/* eslint-disable no-param-reassign */

export default async function preProcessPattern(globalRef, pattern) {
  const { context, logger, inputFileSystem } = globalRef;

  pattern = typeof pattern === 'string' ? { from: pattern } : { ...pattern };
  pattern.fromOrigin = pattern.from;
  pattern.from = path.normalize(pattern.from);
  pattern.to = path.normalize(
    typeof pattern.to !== 'undefined' ? pattern.to : ''
  );
  pattern.context = path.normalize(
    typeof pattern.context !== 'undefined'
      ? !path.isAbsolute(pattern.context)
        ? path.join(context, pattern.context)
        : pattern.context
      : context
  );

  logger.debug(`processing from: '${pattern.from}' to: '${pattern.to}'`);

  const isToDirectory =
    path.extname(pattern.to) === '' || pattern.to.slice(-1) === path.sep;

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

  logger.debug(
    `getting stats for '${pattern.absoluteFrom}' to determinate 'fromType'`
  );

  let stats;

  try {
    stats = await stat(inputFileSystem, pattern.absoluteFrom);
  } catch (error) {
    return pattern;
  }

  if (stats.isDirectory()) {
    pattern.fromType = 'dir';
  } else if (stats.isFile()) {
    pattern.fromType = 'file';
    pattern.stats = stats;
  }

  return pattern;
}
