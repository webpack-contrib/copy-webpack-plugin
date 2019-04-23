import loaderUtils from 'loader-utils';

export default function emitFile(globalRef, content, file, stats) {
  const { logger, compilation, written, copyUnmodified } = globalRef;
  const hash = loaderUtils.getHashDigest(content);

  if (
    !copyUnmodified &&
    written[file.webpackTo] &&
    written[file.webpackTo][file.absoluteFrom] &&
    written[file.webpackTo][file.absoluteFrom] === hash
  ) {
    logger.info(`skipping '${file.webpackTo}', because content hasn't changed`);

    return;
  }

  logger.debug(`adding '${file.webpackTo}' for tracking content changes`);

  if (!written[file.webpackTo]) {
    written[file.webpackTo] = {};
  }

  written[file.webpackTo][file.absoluteFrom] = hash;

  if (compilation.assets[file.webpackTo] && !file.force) {
    logger.info(`skipping '${file.webpackTo}', because it already exists`);

    return;
  }

  logger.info(
    `writing '${file.webpackTo}' to compilation assets from '${
      file.absoluteFrom
    }'`
  );

  compilation.assets[file.webpackTo] = {
    size() {
      return stats.size;
    },
    source() {
      return content;
    },
  };
}
