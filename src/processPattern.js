import Promise from 'bluebird';
import path from 'path';
import _ from 'lodash';
import minimatch from 'minimatch';
import writeFile from './writeFile';

const globAsync = Promise.promisify(require('glob')); // eslint-disable-line import/no-commonjs

export default function processPattern(globalRef, pattern) {
    const {info, debug, output, concurrency} = globalRef;
    const globArgs = _.assign({
        cwd: pattern.context
    }, pattern.fromArgs || {});

    if (pattern.fromType === 'nonexistent') {
        return Promise.resolve();
    }

    info(`begin globbing '${pattern.absoluteFrom}' with a context of '${pattern.context}'`);
    return globAsync(pattern.absoluteFrom, globArgs)
    .map((fileFrom) => {
        const file = {
            force: pattern.force,
            absoluteFrom: path.resolve(pattern.context, fileFrom)
        };
        file.relativeFrom = path.relative(pattern.context, file.absoluteFrom);
        file.relativeFromBeforeFlatten = file.relativeFrom;

        if (pattern.flatten) {
            file.relativeFrom = path.basename(file.relativeFrom);
        }

        debug(`found ${fileFrom}`);

        // Check the ignore list
        let il = pattern.ignore.length;
        while (il--) {
            const ignoreGlob = pattern.ignore[il];

            let globParams = {
                dot: true,
                matchBase: true
            };

            let glob;
            if (_.isString(ignoreGlob)) {
                glob = ignoreGlob;
            } else if (_.isObject(ignoreGlob)) {
                glob = ignoreGlob.glob || '';
                // Overwrite minimatch defaults
                globParams = _.assign(globParams, _.omit(ignoreGlob, ['glob']));
            } else {
                glob = '';
            }

            debug(`testing ${glob} against ${file.relativeFromBeforeFlatten}`);
            if (minimatch(file.relativeFromBeforeFlatten, glob, globParams)) {
                info(`ignoring '${file.relativeFromBeforeFlatten}', because it matches the ignore glob '${glob}'`);
                return;
            } else {
                debug(`${glob} doesn't match ${file.relativeFromBeforeFlatten}`);
            }
        }

        // Change the to path to be relative for webpack
        if (pattern.toType === 'dir') {
            file.webpackTo = path.join(pattern.to, file.relativeFrom);
        } else if (pattern.toType === 'file') {
            file.webpackTo = pattern.to || file.relativeFrom;
        } else if (pattern.toType === 'template') {
            file.webpackTo = pattern.to;
        }

        if (path.isAbsolute(file.webpackTo)) {
            if (output === '/') {
                throw '[copy-webpack-plugin] Using older versions of webpack-dev-server, devServer.outputPath must be defined to write to absolute paths';
            }

            file.webpackTo = path.relative(output, file.webpackTo);
        }

        // ensure forward slashes
        file.webpackTo = file.webpackTo.replace(/\\/g, '/');

        info(`determined that '${fileFrom}' should write to '${file.webpackTo}'`);

        return writeFile(globalRef, pattern, file);
    }, {concurrency: concurrency || 100}); // This is usually less than file read maximums while staying performant
}
