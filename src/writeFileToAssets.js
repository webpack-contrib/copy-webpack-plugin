import path from 'path';
import Promise from 'bluebird';
import loaderUtils from 'loader-utils';

/* eslint-disable import/no-commonjs */
const fs = Promise.promisifyAll(require('fs-extra'));
/* eslint-enable */

import {
    createHash
} from 'crypto';

function getDestName(relFileDest, namePattern) {
    if (!namePattern) {
        return relFileDest;
    }

    var ext = path.extname(relFileDest);
    relFileDest = relFileDest.replace(ext, '');
    return namePattern.replace('[name]', relFileDest);
}

export default (opts) => {
    const compilation = opts.compilation;
    // ensure forward slashes
    var relFileDest = opts.relFileDest.replace(/\\/g, '/');
    const absFileSrc = opts.absFileSrc;
    const forceWrite = opts.forceWrite;
    const copyUnmodified = opts.copyUnmodified;
    const writtenAssetHashes = opts.writtenAssetHashes;
    const namePattern = opts.namePattern;

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
            var relFileDestHash = getDestName(relFileDest, namePattern).replace(/\[(?:(\w+):)?contenthash(?::([a-z]+\d*))?(?::(\d+))?\]/ig, function() {
                return loaderUtils.getHashDigest(fs.readFileSync(absFileSrc), null, null, parseInt(6, 10));
            });

            compilation.assets[relFileDestHash] = {
                size: function() {
                    return stat.size;
                },
                source: function() {
                    return fs.readFileSync(absFileSrc);
                },
                chunk: relFileDest
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
