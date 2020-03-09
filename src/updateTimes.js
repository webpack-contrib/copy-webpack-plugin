/**
 * Attempt to get an Utimes function for the compiler's output filesystem.
 */
function getUtimesFunction(compiler) {
  if (compiler.outputFileSystem.utimes) {
    // Webpack 5+ on Node will use graceful-fs for outputFileSystem so utimes is always there.
    // Other custom outputFileSystems could also have utimes.
    return compiler.outputFileSystem.utimes.bind(compiler.outputFileSystem);
  } else if (
    compiler.outputFileSystem.constructor &&
    compiler.outputFileSystem.constructor.name === 'NodeOutputFileSystem'
  ) {
    // Default NodeOutputFileSystem can just use fs.utimes, but we need to late-import it in case
    // we're running in a web context and statically importing `fs` might be a bad idea.
    // eslint-disable-next-line global-require
    return require('fs').utimes;
  }
  return null;
}

/**
 * Update the times of disk files for which we have recorded a source time
 * @param compiler
 * @param compilation
 * @param logger
 */
function updateTimes(compiler, compilation, logger) {
  const utimes = getUtimesFunction(compiler);
  let nUpdated = 0;
  for (const name of Object.keys(compilation.assets)) {
    const asset = compilation.assets[name];
    // eslint-disable-next-line no-underscore-dangle
    const times = asset.copyPluginTimes;
    if (times) {
      const targetPath =
        asset.existsAt ||
        compiler.outputFileSystem.join(compiler.outputPath, name);
      if (!utimes) {
        logger.warn(
          `unable to update time for ${targetPath} using current file system`
        );
      } else {
        // TODO: process these errors in a better way and/or wait for completion?
        utimes(targetPath, times.atime, times.mtime, (err) => {
          if (err) {
            logger.warn(`${targetPath}: utimes: ${err}`);
          }
        });
        nUpdated += 1;
      }
    }
  }
  if (nUpdated > 0) {
    logger.info(`times updated for ${nUpdated} copied files`);
  }
}

export default updateTimes;
