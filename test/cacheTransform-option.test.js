import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import webpack from 'webpack';
import cacache from 'cacache';
import findCacheDir from 'find-cache-dir';
import isGzip from 'is-gzip';

import { runEmit } from './helpers/run';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

if (webpack.version[0] === '4') {
  describe('cache option', () => {
    const defaultCacheDir = findCacheDir({ name: 'copy-webpack-plugin' });
    const cacheDir1 = findCacheDir({ name: 'copy-webpack-plugin-1' });
    const cacheDir2 = findCacheDir({ name: 'copy-webpack-plugin-2' });
    const cacheDir3 = findCacheDir({ name: 'copy-webpack-plugin-3' });
    const cacheDir4 = findCacheDir({ name: 'copy-webpack-plugin-4' });

    beforeEach(() => [
      cacache.rm.all(defaultCacheDir),
      cacache.rm.all(cacheDir1),
      cacache.rm.all(cacheDir2),
      cacache.rm.all(cacheDir3),
      cacache.rm.all(cacheDir4),
    ]);

    it('should cache when "from" is a file', (done) => {
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
            cacheTransform: true,
            transform: function transform(content) {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache files when "from" is a directory', (done) => {
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
            cacheTransform: true,
            transform: function transform(content) {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(4);
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache when "from" is a glob', (done) => {
      const from = 'directory/*.txt';

      runEmit({
        expectedAssetKeys: ['directory/directoryfile.txt'],
        expectedAssetContent: {
          'directory/directoryfile.txt': 'newchanged!',
        },
        patterns: [
          {
            from,
            cacheTransform: true,
            transform: function transform(content) {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom cache directory', (done) => {
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
            cacheTransform: cacheDir1,
            transform: (content) => {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(cacheDir1).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom cache directory when "cacheTransform" is an object', (done) => {
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
            cacheTransform: {
              directory: cacheDir2,
            },
            transform: (content) => {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(cacheDir2).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom object cache keys when "cacheTransform" is an object', (done) => {
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
            cacheTransform: {
              keys: {
                key: 'foobar',
              },
            },
            transform: (content) => {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);

            cacheKeys.forEach((cacheKey) => {
              // eslint-disable-next-line no-new-func
              const cacheEntry = new Function(
                `'use strict'\nreturn (${cacheKey.replace('transform|', '')});`
              )();

              // expect(cacheEntry.pattern.from).toBe(from);
              expect(cacheEntry.key).toBe('foobar');
            });
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom function cache keys when "cacheTransform" is an object', (done) => {
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
            cacheTransform: {
              keys: (defaultCacheKeys, absoluteFrom) => {
                expect(absoluteFrom).toBeDefined();

                return {
                  ...defaultCacheKeys,
                  key: 'foobar',
                };
              },
            },
            transform: (content) => {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);

            cacheKeys.forEach((cacheKey) => {
              // eslint-disable-next-line no-new-func
              const cacheEntry = new Function(
                `'use strict'\nreturn (${cacheKey.replace('transform|', '')});`
              )();

              // expect(cacheEntry.pattern.from).toBe(from);
              expect(cacheEntry.key).toBe('foobar');
            });
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom async function cache keys when "cacheTransform" is an object', (done) => {
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
            cacheTransform: {
              keys: async (defaultCacheKeys, absoluteFrom) => {
                expect(absoluteFrom).toBeDefined();

                return {
                  ...defaultCacheKeys,
                  key: 'foobar',
                };
              },
            },
            transform: (content) => {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(() =>
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);

            cacheKeys.forEach((cacheKey) => {
              // eslint-disable-next-line no-new-func
              const cacheEntry = new Function(
                `'use strict'\nreturn (${cacheKey.replace('transform|', '')});`
              )();

              // expect(cacheEntry.pattern.from).toBe(from);
              expect(cacheEntry.key).toBe('foobar');
            });
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom object cache keys and custom cache directory when "cacheTransform" is an object', (done) => {
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
            cacheTransform: {
              directory: cacheDir3,
              keys: {
                key: 'foobar',
              },
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
          cacache.ls(cacheDir3).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);

            cacheKeys.forEach((cacheKey) => {
              expect(cacheKey).toContain('foobar');
            });
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache file with custom function cache keys and custom cache directory when "cacheTransform" is an object', (done) => {
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
            cacheTransform: {
              directory: cacheDir4,
              keys: (defaultCacheKeys, absoluteFrom) => {
                expect(absoluteFrom).toBeDefined();

                return {
                  ...defaultCacheKeys,
                  key: 'foobar',
                };
              },
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
          cacache.ls(cacheDir4).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);

            cacheKeys.forEach((cacheKey) => {
              expect(cacheKey).toContain('foobar');
            });
          })
        )
        .then(done)
        .catch(done);
    });

    it('should cache binary file', (done) => {
      const from = 'file.txt.gz';
      const content = fs.readFileSync(path.join(FIXTURES_DIR, from));
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
            cacheTransform: true,
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
          cacache.ls(defaultCacheDir).then((cacheEntries) => {
            const cacheKeys = Object.keys(cacheEntries);

            expect(cacheKeys).toHaveLength(1);
          })
        )
        .then(done)
        .catch(done);
    });
  });
} else {
  describe('cache option', () => {
    it('skip', () => {
      expect(true).toBe(true);
    });
  });
}
