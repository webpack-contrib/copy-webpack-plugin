import path from 'path';

import normalizePath from 'normalize-path';
import globParent from 'glob-parent';

function getAbsoluteContext(context) {
  const result = normalizePath(path.resolve(context));

  return result.replace(
    // eslint-disable-next-line no-useless-escape
    /[\*|\?|\!|\||\@|\+|\(|\)|\[|\]|\{|\}]/g,
    (substring) => `\\${substring}`
  );
}

function createPatternGlob(pattern, globalRef) {
  const { logger, compilation } = globalRef;

  // eslint-disable-next-line no-param-reassign
  pattern.globOptions = Object.assign(
    {
      cwd: pattern.context,
      followSymbolicLinks: true,
    },
    pattern.globOptions || {}
  );

  switch (pattern.fromType) {
    case 'dir':
      logger.debug(`determined '${pattern.absoluteFrom}' is a directory`);
      logger.debug(`add ${pattern.absoluteFrom} as contextDependencies`);

      compilation.contextDependencies.add(pattern.absoluteFrom);

      /* eslint-disable no-param-reassign */
      pattern.context = pattern.absoluteFrom;
      pattern.glob = path.posix.join(
        getAbsoluteContext(pattern.absoluteFrom),
        '**/*'
      );
      pattern.absoluteFrom = path.join(pattern.absoluteFrom, '**/*');

      if (typeof pattern.globOptions.dot === 'undefined') {
        pattern.globOptions.dot = true;
      }
      /* eslint-enable no-param-reassign */

      break;
    case 'file':
      logger.debug(`determined '${pattern.absoluteFrom}' is a file`);
      logger.debug(`add ${pattern.absoluteFrom} as fileDependencies`);

      compilation.fileDependencies.add(pattern.absoluteFrom);

      /* eslint-disable no-param-reassign */
      pattern.context = path.dirname(pattern.absoluteFrom);
      pattern.glob = getAbsoluteContext(pattern.absoluteFrom);

      if (typeof pattern.globOptions.dot === 'undefined') {
        pattern.globOptions.dot = true;
      }
      /* eslint-enable no-param-reassign */

      break;

    default:
      logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);

      // eslint-disable-next-line no-case-declarations
      const contextDependencies = path.normalize(
        globParent(pattern.absoluteFrom)
      );

      logger.debug(`add ${contextDependencies} as contextDependencies`);

      compilation.contextDependencies.add(contextDependencies);

      /* eslint-disable no-param-reassign */
      pattern.fromType = 'glob';
      pattern.glob = path.isAbsolute(pattern.fromOrigin)
        ? pattern.fromOrigin
        : path.posix.join(
            getAbsoluteContext(pattern.context),
            pattern.fromOrigin
          );
    /* eslint-enable no-param-reassign */
  }

  return pattern;
}

export default createPatternGlob;
