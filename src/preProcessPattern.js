import path from 'path';

import isGlob from 'is-glob';

import escape from './utils/escape';
import isObject from './utils/isObject';
import { stat } from './utils/promisify';

// https://www.debuggex.com/r/VH2yS2mvJOitiyr3
const isTemplateLike = /(\[ext\])|(\[name\])|(\[path\])|(\[folder\])|(\[emoji(:\d+)?\])|(\[(\w+:)?(hash|contenthash)(:\w+)?(:\d+)?\])|(\[\d+\])/;

/* eslint-disable no-param-reassign */

export default function preProcessPattern(globalRef, pattern) {
  const {
    info,
    debug,
    warning,
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
    throw new Error('[copy-webpack-plugin] path "from" cannot be empty string');
  }

  pattern.to = pattern.to || '';
  pattern.context = pattern.context || context;

  if (!path.isAbsolute(pattern.context)) {
    pattern.context = path.join(context, pattern.context);
  }

  pattern.ignore = globalRef.ignore.concat(pattern.ignore || []);

  info(`processing from: '${pattern.from}' to: '${pattern.to}'`);

  switch (true) {
    // if toType already exists
    case !!pattern.toType:
      break;
    case isTemplateLike.test(pattern.to):
      pattern.toType = 'template';
      break;
    case path.extname(pattern.to) === '' || pattern.to.slice(-1) === '/':
      pattern.toType = 'dir';
      break;
    default:
      pattern.toType = 'file';
  }

  debug(`determined '${pattern.to}' is a '${pattern.toType}'`);

  // If we know it's a glob, then bail early
  if (isObject(pattern.from) && pattern.from.glob) {
    pattern.fromType = 'glob';

    const globOptions = Object.assign({}, pattern.from);
    delete globOptions.glob;

    pattern.glob = escape(pattern.context, pattern.from.glob);
    pattern.globOptions = globOptions;
    pattern.absoluteFrom = path.resolve(pattern.context, pattern.from.glob);

    return Promise.resolve(pattern);
  }

  if (path.isAbsolute(pattern.from)) {
    pattern.absoluteFrom = pattern.from;
  } else {
    pattern.absoluteFrom = path.resolve(pattern.context, pattern.from);
  }

  debug(
    `determined '${pattern.from}' to be read from '${pattern.absoluteFrom}'`
  );

  const noStatsHandler = () => {
    // If from doesn't appear to be a glob, then log a warning
    if (isGlob(pattern.from) || pattern.from.indexOf('*') !== -1) {
      pattern.fromType = 'glob';
      pattern.glob = escape(pattern.context, pattern.from);

      // We need to add context directory as dependencies to avoid problems when new files added in directories
      // when we already in watch mode and this directories are not in context dependencies
      contextDependencies.add(pattern.context);
    } else {
      const msg = `unable to locate '${pattern.from}' at '${
        pattern.absoluteFrom
      }'`;
      const warningMsg = `[copy-webpack-plugin] ${msg}`;

      // only display the same message once
      if (compilation.errors.indexOf(warningMsg) === -1) {
        warning(msg);

        compilation.errors.push(warningMsg);
      }

      pattern.fromType = 'nonexistent';
    }
  };

  return stat(inputFileSystem, pattern.absoluteFrom)
    .catch(() => noStatsHandler())
    .then((stats) => {
      if (!stats) {
        noStatsHandler();

        return pattern;
      }

      if (stats.isDirectory()) {
        contextDependencies.add(pattern.absoluteFrom);

        pattern.fromType = 'dir';
        pattern.context = pattern.absoluteFrom;
        pattern.glob = escape(pattern.absoluteFrom, '**/*');
        pattern.absoluteFrom = path.join(pattern.absoluteFrom, '**/*');
        pattern.globOptions = {
          dot: true,
        };
      } else if (stats.isFile()) {
        fileDependencies.add(pattern.absoluteFrom);

        pattern.fromType = 'file';
        pattern.context = path.dirname(pattern.absoluteFrom);
        pattern.glob = escape(pattern.absoluteFrom);
        pattern.globOptions = {
          dot: true,
        };
      } else if (!pattern.fromType) {
        info(`Unrecognized file type for ${pattern.from}`);
      }

      return pattern;
    });
}
