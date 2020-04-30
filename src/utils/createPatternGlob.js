import path from 'path';

import normalizePath from 'normalize-path';
import globParent from 'glob-parent';

/* eslint-disable no-param-reassign */

function getAbsoluteContext(context) {
  const result = normalizePath(path.resolve(context));

  return result.replace(
    // eslint-disable-next-line no-useless-escape
    /[\*|\?|\!|\||\@|\+|\(|\)|\[|\]|\{|\}]/g,
    (substring) => `\\${substring}`
  );
}

function createPatternGlob(pattern, globalRef) {
  const { logger, fileDependencies, contextDependencies } = globalRef;

  switch (pattern.fromType) {
    case 'dir':
      logger.debug(`determined '${pattern.absoluteFrom}' is a directory`);
      contextDependencies.add(pattern.absoluteFrom);

      pattern.context = pattern.absoluteFrom;
      pattern.glob = path.posix.join(
        getAbsoluteContext(pattern.absoluteFrom),
        '**/*'
      );
      pattern.absoluteFrom = path.join(pattern.absoluteFrom, '**/*');
      pattern.globOptions = {
        dot: true,
      };
      break;

    case 'file':
      logger.debug(`determined '${pattern.absoluteFrom}' is a file`);
      fileDependencies.add(pattern.absoluteFrom);

      pattern.context = path.dirname(pattern.absoluteFrom);
      pattern.glob = getAbsoluteContext(pattern.absoluteFrom);
      pattern.globOptions = {
        dot: true,
      };
      break;

    default:
      logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);
      contextDependencies.add(path.normalize(globParent(pattern.absoluteFrom)));

      pattern.fromType = 'glob';
      pattern.globOptions = pattern.globOptions || {};
      pattern.glob = path.isAbsolute(pattern.fromOrigin)
        ? pattern.fromOrigin
        : path.posix.join(
            getAbsoluteContext(pattern.context),
            pattern.fromOrigin
          );
  }

  return pattern;
}

export default createPatternGlob;
