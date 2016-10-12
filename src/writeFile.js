import Promise from 'bluebird';
import loaderUtils from 'loader-utils';

const fs = Promise.promisifyAll(require('fs')); // eslint-disable-line import/no-commonjs

export default function writeFile(globalRef, pattern, file) {
    const {info, debug, compilation, fileDependencies, written, copyUnmodified} = globalRef;

    return fs.statAsync(file.absoluteFrom)
    .then((stat) => {
        // We don't write empty directories
        if (stat.isDirectory()) {
            return;
        }

        // If this came from a glob, add it to the file watchlist
        if (pattern.fromType === 'glob') {
            fileDependencies.push(file.absoluteFrom);
        }

        info(`reading ${file.absoluteFrom} to write to assets`);
        return fs.readFileAsync(file.absoluteFrom)
        .then((content) => {
            var hash = loaderUtils.getHashDigest(content);
            if (!copyUnmodified &&
                written[file.absoluteFrom] && written[file.absoluteFrom][hash]) {
                info(`skipping '${file.webpackTo}', because it hasn't changed`);
                return;
            } else {
                debug(`added ${hash} to written tracking for '${file.absoluteFrom}'`);
                written[file.absoluteFrom] = {
                    [hash]: true
                };
            }

            if (compilation.assets[file.webpackTo] && !file.force) {
                info(`skipping '${file.webpackTo}', because it already exists`);
                return;
            }

            info(`writing '${file.webpackTo}' to compilation assets from '${file.absoluteFrom}'`);
            compilation.assets[file.webpackTo] = {
                size: function() {
                    return stat.size;
                },
                source: function() {
                    return content;
                }
            };
        });
    });
}
