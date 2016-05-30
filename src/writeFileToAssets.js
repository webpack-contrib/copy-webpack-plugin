import Promise from 'bluebird';

/* eslint-disable import/no-commonjs */
const fs = Promise.promisifyAll(require('fs-extra'));
/* eslint-enable */

import {
    createHash
} from 'crypto';

export default (opts) => {
    const compilation = opts.compilation;
    // ensure forward slashes
    const relFileDest = opts.relFileDest.replace(/\\/g, '/');
    const absFileSrc = opts.absFileSrc;
    const forceWrite = opts.forceWrite;
    const copyUnmodified = opts.copyUnmodified;
    const writtenAssetHashes = opts.writtenAssetHashes;

    if (compilation.assets[relFileDest] && !forceWrite) {
        return Promise.resolve();
    }

    return fs
    .statAsync(absFileSrc)
    .then((stat) => {

        // We don't write empty directories
        if (stat.isDirectory()) {
            return;
        }

        function addToAssets() {
            compilation.assets[relFileDest] = {
                size () {
                    return stat.size;
                },
                source () {
                    return fs.readFileSync(absFileSrc);
                }
            };

            return relFileDest;
        }

        if (copyUnmodified) {
            return addToAssets();
        }

        return fs.readFileAsync(absFileSrc)
        .then((contents) => {
            const hash = createHash('sha256').update(contents).digest('hex');
            if (writtenAssetHashes[relFileDest] && writtenAssetHashes[relFileDest] === hash) {
                return;
            }

            writtenAssetHashes[relFileDest] = hash;
            return addToAssets();
        });
    });
};
