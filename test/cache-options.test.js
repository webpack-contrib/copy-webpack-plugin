import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import cacache from 'cacache';
import findCacheDir from 'find-cache-dir';
import isGzip from 'is-gzip';

import { runEmit } from './utils/run';

const HELPER_DIR = path.join(__dirname, 'helpers');

describe('cache option', () => {
  const cacheDir = findCacheDir({ name: 'copy-webpack-plugin' });

  beforeEach(() => cacache.rm.all(cacheDir));

  it('file should be cached', (done) => {
    const newContent = 'newchanged!';
    const from = 'file.txt';

    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': newContent,
      },
      patterns: [
        {
          from,
          cache: true,
          transform: function transform(content) {
            return new Promise((resolve) => {
              resolve(`${content}changed!`);
            });
          },
        },
      ],
    })
      .then(() =>
        cacache.ls(cacheDir).then((cacheEntries) => {
          const cacheKeys = Object.keys(cacheEntries);

          expect(cacheKeys).toHaveLength(1);

          cacheKeys.forEach((cacheKey) => {
            // eslint-disable-next-line no-new-func
            const cacheEntry = new Function(
              `'use strict'\nreturn ${cacheKey}`
            )();

            expect(cacheEntry.pattern.from).toBe(from);
          });
        })
      )
      .then(done)
      .catch(done);
  });

  it('files in directory should be cached', (done) => {
    const from = 'directory';

    runEmit({
      expectedAssetKeys: [
        '.dottedfile',
        'directoryfile.txt',
        'nested/deep-nested/deepnested.txt',
        'nested/nestedfile.txt',
      ],
      expectedAssetContent: {
        '.dottedfile': 'dottedfile contents\nchanged!',
        'directoryfile.txt': 'newchanged!',
        'nested/nestedfile.txt': 'changed!',
      },
      patterns: [
        {
          from,
          cache: true,
          transform: function transform(content) {
            return new Promise((resolve) => {
              resolve(`${content}changed!`);
            });
          },
        },
      ],
    })
      .then(() =>
        cacache.ls(cacheDir).then((cacheEntries) => {
          const cacheKeys = Object.keys(cacheEntries);

          expect(cacheKeys).toHaveLength(3);

          cacheKeys.forEach((cacheKey) => {
            // eslint-disable-next-line no-new-func
            const cacheEntry = new Function(
              `'use strict'\nreturn ${cacheKey}`
            )();

            expect(cacheEntry.pattern.from).toBe(from);
          });
        })
      )
      .then(done)
      .catch(done);
  });

  it('glob should be cached', (done) => {
    const from = '*.txt';

    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': 'newchanged!',
      },
      patterns: [
        {
          from,
          cache: true,
          transform: function transform(content) {
            return new Promise((resolve) => {
              resolve(`${content}changed!`);
            });
          },
        },
      ],
    })
      .then(() =>
        cacache.ls(cacheDir).then((cacheEntries) => {
          const cacheKeys = Object.keys(cacheEntries);

          expect(cacheKeys).toHaveLength(1);

          cacheKeys.forEach((cacheKey) => {
            // eslint-disable-next-line no-new-func
            const cacheEntry = new Function(
              `'use strict'\nreturn ${cacheKey}`
            )();

            expect(cacheEntry.pattern.from).toBe(from);
          });
        })
      )
      .then(done)
      .catch(done);
  });

  it('file should be cached with custom cache key', (done) => {
    const newContent = 'newchanged!';
    const from = 'file.txt';

    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': newContent,
      },
      patterns: [
        {
          from,
          cache: {
            key: 'foobar',
          },
          transform(content) {
            return new Promise((resolve) => {
              resolve(`${content}changed!`);
            });
          },
        },
      ],
    })
      .then(() =>
        cacache.ls(cacheDir).then((cacheEntries) => {
          const cacheKeys = Object.keys(cacheEntries);

          expect(cacheKeys).toHaveLength(1);

          cacheKeys.forEach((cacheKey) => {
            expect(cacheKey).toBe('foobar');
          });
        })
      )
      .then(done)
      .catch(done);
  });

  it('binary file should be cached', (done) => {
    const from = 'file.txt.gz';
    const content = fs.readFileSync(path.join(HELPER_DIR, from));
    const expectedNewContent = zlib.gzipSync('newchanged!');

    expect(isGzip(content)).toBe(true);
    expect(isGzip(expectedNewContent)).toBe(true);

    runEmit({
      expectedAssetKeys: ['file.txt.gz'],
      expectedAssetContent: {
        'file.txt.gz': expectedNewContent,
      },
      patterns: [
        {
          from,
          cache: true,
          // eslint-disable-next-line no-shadow
          transform: function transform(content) {
            expect(isGzip(content)).toBe(true);

            return new Promise((resolve) => {
              // eslint-disable-next-line no-shadow
              zlib.unzip(content, (error, content) => {
                if (error) {
                  throw error;
                }

                const newContent = Buffer.from(`${content}changed!`);

                // eslint-disable-next-line no-shadow
                zlib.gzip(newContent, (error, compressedData) => {
                  if (error) {
                    throw error;
                  }

                  expect(isGzip(compressedData)).toBe(true);

                  return resolve(compressedData);
                });
              });
            });
          },
        },
      ],
    })
      .then(() =>
        cacache.ls(cacheDir).then((cacheEntries) => {
          const cacheKeys = Object.keys(cacheEntries);

          expect(cacheKeys).toHaveLength(1);

          cacheKeys.forEach((cacheKey) => {
            // eslint-disable-next-line no-new-func
            const cacheEntry = new Function(
              `'use strict'\nreturn ${cacheKey}`
            )();

            expect(cacheEntry.pattern.from).toBe(from);
          });
        })
      )
      .then(done)
      .catch(done);
  });
});
