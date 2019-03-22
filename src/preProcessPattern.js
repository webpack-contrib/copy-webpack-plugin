import path from 'path';

import isGlob from 'is-glob';
import globParent from 'glob-parent';

import normalize from './utils/normalize';
import isTemplateLike from './utils/isTemplateLike';
import isObject from './utils/isObject';
import { stat } from './utils/promisify';

/* eslint-disable no-param-reassign */

export default function preProcessPattern(globalRef, pattern) {
  const {
    logger,
    context,
    inputFileSystem,
    fileDependencies,
    contextDependencies,
    compilation,
  } = globalRef;

  pattern =
    typeof pattern === 'string'
      ? {
          from: pattern,
        }
      : Object.assign({}, pattern);

  if (pattern.from === '') {
    const message = 'path "from" cannot be empty string';

    logger.error(message);

    compilation.errors.push(new Error(message));
  }

  pattern.to = pattern.to || '';
  pattern.context = pattern.context || context;

  if (!path.isAbsolute(pattern.context)) {
    pattern.context = path.join(context, pattern.context);
  }

  const isFromGlobPatten = isObject(pattern.from) && pattern.from.glob;
  // Todo remove this in next major
  const isToDirectory =
    path.extname(pattern.to) === '' || pattern.to.slice(-1) === path.sep;

  // Normalize paths
  pattern.from = isFromGlobPatten ? pattern.from : path.normalize(pattern.from);
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

  // If we know it's a glob, then bail early
  if (isFromGlobPatten) {
    logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);

    pattern.fromType = 'glob';

    const globOptions = Object.assign({}, pattern.from);
    delete globOptions.glob;

    pattern.glob = normalize(pattern.context, pattern.from.glob);
    pattern.globOptions = globOptions;
    pattern.absoluteFrom = path.resolve(pattern.context, pattern.from.glob);

    return Promise.resolve(pattern);
  }

  if (path.isAbsolute(pattern.from)) {
    pattern.absoluteFrom = pattern.from;
  } else {
    pattern.absoluteFrom = path.resolve(pattern.context, pattern.from);
  }

  logger.debug(
    `determined '${pattern.from}' to be read from '${pattern.absoluteFrom}'`
  );

  const noStatsHandler = () => {
    // If from doesn't appear to be a glob, then log a warning
    if (isGlob(pattern.from) || pattern.from.indexOf('*') !== -1) {
      logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);

      pattern.fromType = 'glob';
      pattern.glob = normalize(pattern.context, pattern.from);

      // We need to add context directory as dependencies to avoid problems when new files added in directories
      // when we already in watch mode and this directories are not in context dependencies
      // `glob-parent` always return `/` we need normalize path
      contextDependencies.add(path.normalize(globParent(pattern.absoluteFrom)));
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
    .catch(() => noStatsHandler())
    .then((stats) => {
      if (!stats) {
        noStatsHandler();

        return pattern;
      }

      if (stats.isDirectory()) {
        logger.debug(`determined '${pattern.absoluteFrom}' is a directory`);

        contextDependencies.add(pattern.absoluteFrom);

        pattern.fromType = 'dir';
        pattern.context = pattern.absoluteFrom;
        pattern.glob = normalize(pattern.absoluteFrom, '**/*');
        pattern.absoluteFrom = path.join(pattern.absoluteFrom, '**/*');
        pattern.globOptions = {
          dot: true,
        };
      } else if (stats.isFile()) {
        logger.debug(`determined '${pattern.absoluteFrom}' is a file`);

        fileDependencies.add(pattern.absoluteFrom);

        pattern.stats = stats;
        pattern.fromType = 'file';
        pattern.context = path.dirname(pattern.absoluteFrom);
        pattern.glob = normalize(pattern.absoluteFrom);
        pattern.globOptions = {
          dot: true,
        };
      } else if (!pattern.fromType) {
        logger.warn(`unrecognized file type for ${pattern.from}`);
      }

      return pattern;
    });
}
