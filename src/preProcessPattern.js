import path from 'path';

import isTemplateLike from './utils/isTemplateLike';
import { stat } from './utils/promisify';

/* eslint-disable no-param-reassign */

export default async function preProcessPattern(globalRef, pattern) {
  const { context, logger, inputFileSystem } = globalRef;

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

  logger.debug(
    `getting stats for '${pattern.absoluteFrom}' to determinate 'fromType'`
  );

  try {
    const stats = await stat(inputFileSystem, pattern.absoluteFrom);

    if (!stats) {
      return pattern;
    }

    if (stats.isDirectory()) {
      pattern.fromType = 'dir';
    } else if (stats.isFile()) {
      pattern.fromType = 'file';
      pattern.stats = stats;
    } else if (!pattern.fromType) {
      logger.warn(`unrecognized file type for ${pattern.from}`);
    }
  } catch (error) {
    return pattern;
  }

  return pattern;
}
