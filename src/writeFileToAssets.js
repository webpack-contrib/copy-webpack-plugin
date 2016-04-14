import Promise from 'bluebird';

/* eslint-disable import/no-commonjs */
const fs = Promise.promisifyAll(require('fs-extra'));
/* eslint-enable */

export default (opts) => {
  const compilation = opts.compilation;
  // ensure forward slashes
  const relFileDest = opts.relFileDest.replace(/\\/g, '/');
  const absFileSrc = opts.absFileSrc;
  const forceWrite = opts.forceWrite;

  if (compilation.assets[relFileDest] && !forceWrite) {
    return Promise.resolve();
  }

  return fs
  .statAsync(absFileSrc)
  .then((stat) => {
    compilation.assets[relFileDest] = {
      size () {
        return stat.size;
      },
      source () {
        return fs.readFileSync(absFileSrc);
      }
    };

    return relFileDest;
  });
};
