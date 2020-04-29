import path from 'path';

import normalizePath from 'normalize-path';
import isGlobPackage from 'is-glob';
import globParent from 'glob-parent';

/* eslint-disable no-param-reassign */

function isGlob(pattern) {
  if (pattern.fromType === 'dir' || pattern.fromType === 'file') {
    return false;
  }

  if (isGlobPackage(pattern.from) || pattern.from.includes('*')) {
    return true;
  }

  return false;
}

function getAbsoluteContext(context) {
  const result = normalizePath(path.resolve(context));

  return result.replace(
    // eslint-disable-next-line no-useless-escape
    /[\*|\?|\!|\(|\)|\[|\]|\{|\}]/g,
    (substring) => `\\${substring}`
  );
}

function process(pattern, globalRef) {
  const { logger, fileDependencies, contextDependencies } = globalRef;

  const fromIsGlob = isGlob(pattern);

  if (fromIsGlob) {
    logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);

    pattern.fromType = 'glob';

    pattern.globOptions = pattern.globOptions || {};
    pattern.glob = path.isAbsolute(pattern.fromOrigin)
      ? pattern.fromOrigin
      : path.posix.join(
          getAbsoluteContext(pattern.context),
          pattern.fromOrigin
        );

    contextDependencies.add(path.normalize(globParent(pattern.absoluteFrom)));
    return pattern;
  }

  if (pattern.fromType === 'dir') {
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

    return pattern;
  }

  if (pattern.fromType === 'file') {
    logger.debug(`determined '${pattern.absoluteFrom}' is a file`);

    fileDependencies.add(pattern.absoluteFrom);

    pattern.context = path.dirname(pattern.absoluteFrom);
    pattern.glob = getAbsoluteContext(pattern.absoluteFrom);
    pattern.globOptions = {
      dot: true,
    };

    return pattern;
  }

  return pattern;
}

export default function createPatternGlob(pattern, globalRef) {
  return process(pattern, globalRef);
}
