import Promise from 'bluebird';
import _ from 'lodash';
import shouldIgnore from './shouldIgnore';
import path from 'path';
import writeFileToAssets from './writeFileToAssets';

/* eslint-disable import/no-commonjs */
const dir = Promise.promisifyAll(require('node-dir'));
/* eslint-enable */

export default (opts) => {
    const compilation = opts.compilation;
    const absDirSrc = opts.absDirSrc;
    const relDirDest = opts.relDirDest;
    const flatten = opts.flatten;
    const forceWrite = opts.forceWrite;
    const ignoreList = opts.ignoreList;
    const copyUnmodified = opts.copyUnmodified;
    const writtenAssetHashes = opts.writtenAssetHashes;
    const namePattern = opts.namePattern;

    return dir.filesAsync(absDirSrc)
        .map((absFileSrc) => {
            let relFileDest;

            const relFileSrc = path.relative(absDirSrc, absFileSrc);

            relFileDest = path.join(relDirDest, relFileSrc);

            // Remove any directory reference if flattening
            if (flatten) {
                relFileDest = path.join(relDirDest, path.basename(relFileDest));
            }

            // Skip if it matches any of our ignore list
            if (shouldIgnore(relFileSrc, ignoreList)) {
                return false;
            }

            // Make sure it doesn't start with the separator
            if (_.head(relFileDest) === path.sep) {
                relFileDest = relFileDest.slice(1);
            }

            return writeFileToAssets({
                absFileSrc,
                compilation,
                copyUnmodified,
                forceWrite,
                relFileDest,
                writtenAssetHashes,
                namePattern
            });
        });
};
