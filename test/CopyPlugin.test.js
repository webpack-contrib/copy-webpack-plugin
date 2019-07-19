import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import NodeJsInputFileSystem from 'enhanced-resolve/lib/NodeJsInputFileSystem';
import CachedInputFileSystem from 'enhanced-resolve/lib/CachedInputFileSystem';

import findCacheDir from 'find-cache-dir';
import cacache from 'cacache';
import isGzip from 'is-gzip';
import mkdirp from 'mkdirp';

import CopyPlugin from '../src/index';

import removeIllegalCharacterForWindows from './utils/removeIllegalCharacterForWindows';

const BUILD_DIR = path.join(__dirname, 'build');
const HELPER_DIR = path.join(__dirname, 'helpers');
const TEMP_DIR = path.join(__dirname, 'tempdir');

class MockCompiler {
  constructor(options = {}) {
    this.options = {
      context: HELPER_DIR,
      output: {
        path: options.outputPath || BUILD_DIR,
      },
    };

    if (options.devServer && options.devServer.outputPath) {
      this.options.devServer = {
        outputPath: options.devServer.outputPath,
      };
    }

    this.inputFileSystem = new CachedInputFileSystem(
      new NodeJsInputFileSystem(),
      0
    );

    this.hooks = {
      emit: {
        tapAsync: (plugin, fn) => {
          this.hooks.emit = fn;
        },
      },
      afterEmit: {
        tapAsync: (plugin, fn) => {
          this.hooks.afterEmit = fn;
        },
      },
    };

    this.outputFileSystem = {
      constructor: {
        name: 'NotMemoryFileSystem',
      },
    };
  }
}

class MockCompilerNoStat extends MockCompiler {
  constructor(options = {}) {
    super(options);

    // eslint-disable-next-line no-undefined
    this.inputFileSystem.stat = (file, cb) => cb(undefined, undefined);
  }
}

describe('apply function', () => {
  // Ideally we pass in patterns and confirm the resulting assets
  const run = (opts) =>
    new Promise((resolve, reject) => {
      if (Array.isArray(opts.patterns)) {
        opts.patterns.forEach((pattern) => {
          if (pattern.context) {
            // eslint-disable-next-line no-param-reassign
            pattern.context = removeIllegalCharacterForWindows(pattern.context);
          }
        });
      }

      // Get a mock compiler to pass to plugin.apply
      const compiler = opts.compiler || new MockCompiler();

      const isWin = process.platform === 'win32';

      if (!opts.symlink || isWin) {
        if (!opts.options) {
          // eslint-disable-next-line no-param-reassign
          opts.options = {};
        }

        if (!opts.options.ignore) {
          // eslint-disable-next-line no-param-reassign
          opts.options.ignore = [];
        }

        opts.options.ignore.push('symlink/**/*', 'file-ln.txt', 'directory-ln');
      }

      new CopyPlugin(opts.patterns, opts.options).apply(compiler);

      // Call the registered function with a mock compilation and callback
      const compilation = Object.assign(
        {
          assets: {},
          errors: [],
          warnings: [],
          fileDependencies: new Set(),
          contextDependencies: new Set(),
        },
        opts.compilation
      );

      // Execute the functions in series
      return Promise.resolve()
        .then(
          () =>
            new Promise((res, rej) => {
              try {
                compiler.hooks.emit(compilation, res);
              } catch (error) {
                rej(error);
              }
            })
        )
        .then(
          () =>
            new Promise((res, rej) => {
              try {
                compiler.hooks.afterEmit(compilation, res);
              } catch (error) {
                rej(error);
              }
            })
        )
        .then(() => {
          if (opts.expectedErrors) {
            expect(compilation.errors).toEqual(opts.expectedErrors);
          } else if (compilation.errors.length > 0) {
            throw compilation.errors[0];
          }

          if (opts.expectedWarnings) {
            expect(compilation.warnings).toEqual(opts.expectedWarnings);
          } else if (compilation.warnings.length > 0) {
            throw compilation.warnings[0];
          }

          resolve(compilation);
        })
        .catch(reject);
    });

  const runEmit = (opts) =>
    run(opts).then((compilation) => {
      if (opts.skipAssetsTesting) {
        return;
      }

      if (opts.expectedAssetKeys && opts.expectedAssetKeys.length > 0) {
        expect(Object.keys(compilation.assets).sort()).toEqual(
          opts.expectedAssetKeys
            .sort()
            .map(removeIllegalCharacterForWindows)
            .map((item) => item.replace(/\//g, path.sep))
        );
      } else {
        expect(compilation.assets).toEqual({});
      }

      if (opts.expectedAssetContent) {
        // eslint-disable-next-line guard-for-in
        for (const key in opts.expectedAssetContent) {
          const assetName = key.replace(/(\/|\\)/g, path.sep);

          expect(compilation.assets[assetName]).toBeDefined();

          if (compilation.assets[assetName]) {
            let expectedContent = opts.expectedAssetContent[key];

            if (!Buffer.isBuffer(expectedContent)) {
              expectedContent = Buffer.from(expectedContent);
            }

            let compiledContent = compilation.assets[assetName].source();

            if (!Buffer.isBuffer(compiledContent)) {
              compiledContent = Buffer.from(compiledContent);
            }

            expect(Buffer.compare(expectedContent, compiledContent)).toBe(0);
          }
        }
      }
    });

  const runForce = (opts) => {
    // eslint-disable-next-line no-param-reassign
    opts.compilation = {
      assets: {},
    };
    // eslint-disable-next-line no-param-reassign
    opts.compilation.assets[opts.existingAsset] = {
      source() {
        return 'existing';
      },
    };

    return run(opts).then(() => {});
  };

  const runChange = (opts) => {
    // Create two test files
    fs.writeFileSync(opts.newFileLoc1, 'file1contents');
    fs.writeFileSync(opts.newFileLoc2, 'file2contents');

    // Create a reference to the compiler
    const compiler = new MockCompiler();
    const compilation = {
      assets: {},
      errors: [],
      warnings: [],
      fileDependencies: new Set(),
      contextDependencies: new Set(),
    };

    return run({
      compiler,
      options: opts.options,
      patterns: opts.patterns,
    })
      .then(() => {
        // Change a file
        fs.appendFileSync(opts.newFileLoc1, 'extra');

        // Trigger another compile
        return new Promise((res) => {
          compiler.hooks.emit(compilation, res);
        });
      })
      .then(() => {
        if (opts.expectedAssetKeys && opts.expectedAssetKeys.length > 0) {
          expect(Object.keys(compilation.assets).sort()).toEqual(
            opts.expectedAssetKeys
              .sort()
              .map(removeIllegalCharacterForWindows)
              .map((item) => item.replace(/\//g, path.sep))
          );
        } else {
          expect(compilation.assets).toEqual({});
        }
      })
      .then(() => {
        // Todo finally and check file exists
        fs.unlinkSync(opts.newFileLoc1);
        fs.unlinkSync(opts.newFileLoc2);
      });
  };

  const specialFiles = {
    '[special?directory]/nested/nestedfile.txt': '',
    '[special?directory]/(special-*file).txt': 'special',
    '[special?directory]/directoryfile.txt': 'new',
  };

  const baseDir = path.join(__dirname, 'helpers');

  beforeAll(() => {
    Object.keys(specialFiles).forEach((originFile) => {
      const file = removeIllegalCharacterForWindows(originFile);
      const dir = path.dirname(file);

      mkdirp.sync(path.join(baseDir, dir));

      fs.writeFileSync(path.join(baseDir, file), specialFiles[originFile]);
    });
  });

  // Use then and catch explicitly, so errors
  // aren't seen as unhandled exceptions
  describe('error handling', () => {
    it("doesn't throw an error if no patterns are passed", (done) => {
      runEmit({
        expectedAssetKeys: [],
        patterns: undefined, // eslint-disable-line no-undefined
      })
        .then(done)
        .catch(done);
    });

    it('throws an error if the patterns are an object', () => {
      const createPluginWithObject = () => {
        // eslint-disable-next-line no-new
        new CopyPlugin({});
      };

      expect(createPluginWithObject).toThrow(Error);
    });

    it('throws an error if the patterns are null', () => {
      const createPluginWithNull = () => {
        // eslint-disable-next-line no-new
        new CopyPlugin(null);
      };

      expect(createPluginWithNull).toThrow(Error);
    });

    it('throws an error if the "from" path is an empty string', () => {
      const createPluginWithNull = () => {
        // eslint-disable-next-line no-new
        new CopyPlugin({
          from: '',
        });
      };

      expect(createPluginWithNull).toThrow(Error);
    });
  });

  describe('with glob in from', () => {
    it('can use a glob to move a file to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: '*.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a bracketed glob to move a file to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          'file.txt',
          'noextension',
        ],
        patterns: [
          {
            from: '{file.txt,noextension,directory/**/*}',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob object to move a file to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: {
              glob: '*.txt',
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob object to move a file to the root directory and respect glob options', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: {
              glob: '*.txt',
              dot: false,
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move multiple files to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[!]/hello.txt',
          'binextension.bin',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
          'file.txt',
          'file.txt.gz',
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          '[special?directory]/directoryfile.txt',
          '[special?directory]/(special-*file).txt',
          '[special?directory]/nested/nestedfile.txt',
          'noextension',
        ],
        patterns: [
          {
            from: '**/*',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move multiple files to a non-root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/[!]/hello.txt',
          'nested/binextension.bin',
          'nested/dir (86)/file.txt',
          'nested/dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'nested/dir (86)/nesteddir/nestedfile.txt',
          'nested/file.txt',
          'nested/file.txt.gz',
          'nested/directory/directoryfile.txt',
          'nested/directory/nested/deep-nested/deepnested.txt',
          'nested/directory/nested/nestedfile.txt',
          'nested/[special?directory]/directoryfile.txt',
          'nested/[special?directory]/(special-*file).txt',
          'nested/[special?directory]/nested/nestedfile.txt',
          'nested/noextension',
        ],
        patterns: [
          {
            from: '**/*',
            to: 'nested',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can transform target path of every file in glob', (done) => {
      runEmit({
        expectedAssetKeys: [
          '/some/path/(special-*file).txt.tst',
          '/some/path/binextension.bin.tst',
          '/some/path/deepnested.txt.tst',
          '/some/path/deepnesteddir.txt.tst',
          '/some/path/file.txt.tst',
          '/some/path/file.txt.gz.tst',
          '/some/path/directoryfile.txt.tst',
          '/some/path/nestedfile.txt.tst',
          '/some/path/noextension.tst',
          '/some/path/hello.txt.tst',
        ],
        patterns: [
          {
            from: '**/*',
            transformPath(targetPath, absoluteFrom) {
              expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

              return `/some/path/${path.basename(targetPath)}.tst`;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can transform target path of every file in glob after applying template', (done) => {
      runEmit({
        expectedAssetKeys: [
          'transformed/[!]/hello-d41d8c.txt',
          'transformed/[special?directory]/directoryfile-22af64.txt',
          'transformed/[special?directory]/(special-*file)-0bd650.txt',
          'transformed/[special?directory]/nested/nestedfile-d41d8c.txt',
          'transformed/binextension-d41d8c.bin',
          'transformed/dir (86)/file-d41d8c.txt',
          'transformed/dir (86)/nesteddir/deepnesteddir/deepnesteddir-d41d8c.txt',
          'transformed/dir (86)/nesteddir/nestedfile-d41d8c.txt',
          'transformed/file-22af64.txt',
          'transformed/file.txt-5b311c.gz',
          'transformed/directory/directoryfile-22af64.txt',
          'transformed/directory/nested/deep-nested/deepnested-d41d8c.txt',
          'transformed/directory/nested/nestedfile-d41d8c.txt',
          'transformed/noextension-d41d8c',
        ],
        patterns: [
          {
            from: '**/*',
            to: 'nested/[path][name]-[hash:6].[ext]',
            transformPath(targetPath, absoluteFrom) {
              expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

              return targetPath.replace(
                `nested${path.sep}`,
                `transformed${path.sep}`
              );
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move multiple files in a different relative context to a non-root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/directoryfile.txt',
          'nested/nested/deep-nested/deepnested.txt',
          'nested/nested/nestedfile.txt',
        ],
        patterns: [
          {
            context: 'directory',
            from: '**/*',
            to: 'nested',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a direct glob to move multiple files in a different relative context with special characters', (done) => {
      runEmit({
        expectedAssetKeys: [
          'directoryfile.txt',
          '(special-*file).txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            context: '[special?directory]',
            from: { glob: '**/*' },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move multiple files in a different relative context with special characters', (done) => {
      runEmit({
        expectedAssetKeys: [
          'directoryfile.txt',
          '(special-*file).txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            context: '[special?directory]',
            from: '**/*',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to flatten multiple files in a relative context to a non-root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/deepnested.txt',
          'nested/directoryfile.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            context: 'directory',
            flatten: true,
            from: '**/*',
            to: 'nested',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move multiple files in a different absolute context to a non-root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/directoryfile.txt',
          'nested/nested/deep-nested/deepnested.txt',
          'nested/nested/nestedfile.txt',
        ],
        patterns: [
          {
            context: path.join(HELPER_DIR, 'directory'),
            from: '**/*',
            to: 'nested',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob with a full path to move a file to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: path.join(HELPER_DIR, '*.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob with a full path to move multiple files to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[!]/hello.txt',
          'file.txt',
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          '[special?directory]/directoryfile.txt',
          '[special?directory]/(special-*file).txt',
          '[special?directory]/nested/nestedfile.txt',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
        ],
        patterns: [
          {
            from: path.join(HELPER_DIR, '**/*.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move multiple files to a non-root directory with name, hash and ext', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/[!]/hello-d41d8c.txt',
          'nested/binextension-d41d8c.bin',
          'nested/dir (86)/file-d41d8c.txt',
          'nested/dir (86)/nesteddir/deepnesteddir/deepnesteddir-d41d8c.txt',
          'nested/dir (86)/nesteddir/nestedfile-d41d8c.txt',
          'nested/file-22af64.txt',
          'nested/file.txt-5b311c.gz',
          'nested/directory/directoryfile-22af64.txt',
          'nested/directory/nested/deep-nested/deepnested-d41d8c.txt',
          'nested/directory/nested/nestedfile-d41d8c.txt',
          'nested/[special?directory]/(special-*file)-0bd650.txt',
          'nested/[special?directory]/directoryfile-22af64.txt',
          'nested/[special?directory]/nested/nestedfile-d41d8c.txt',
          'nested/noextension-d41d8c',
        ],
        patterns: [
          {
            from: '**/*',
            to: 'nested/[path][name]-[hash:6].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can flatten or normalize glob matches', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[!]-hello.txt',
          '[special?directory]-(special-*file).txt',
          '[special?directory]-directoryfile.txt',
          'dir (86)-file.txt',
          'directory-directoryfile.txt',
        ],
        patterns: [
          {
            from: '*/*.*',
            test: `([^\\${path.sep}]+)\\${path.sep}([^\\${path.sep}]+)\\.\\w+$`,
            to: '[1]-[2].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('adds the context directory to the watch list when using glob', (done) => {
      run({
        patterns: [
          {
            from: 'directory/**/*',
          },
        ],
      })
        .then((compilation) => {
          expect(
            Array.from(compilation.contextDependencies)
              .map((contextDependency) => contextDependency)
              .sort()
          ).toEqual([path.join(HELPER_DIR, 'directory')].sort());
        })
        .then(done)
        .catch(done);
    });

    it('does not add the directory to the watch list when glob is a file', (done) => {
      run({
        patterns: [
          {
            from: {
              glob: 'directory/directoryfile.txt',
            },
          },
        ],
      })
        .then((compilation) => {
          const absFrom = path.resolve(HELPER_DIR, 'directory');
          expect(compilation.contextDependencies).not.toContain(absFrom);
        })
        .then(done)
        .catch(done);
    });

    it('can use a glob to move a file to the root directory from symbolic link', (done) => {
      runEmit({
        // Windows doesn't support symbolic link
        symlink: true,
        expectedAssetKeys:
          process.platform === 'win32'
            ? []
            : [
                'symlink/directory-ln/file.txt',
                'symlink/directory-ln/nested-directory/file-in-nested-directory.txt',
                'symlink/directory/file.txt',
                'symlink/directory/nested-directory/file-in-nested-directory.txt',
                'symlink/file-ln.txt',
                'symlink/file.txt',
              ],
        patterns: [
          {
            from: 'symlink/**/*.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('with file in from', () => {
    it('can move a file to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: 'file.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can transform a file', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        expectedAssetContent: {
          'file.txt': 'newchanged',
        },
        patterns: [
          {
            from: 'file.txt',
            transform(content, absoluteFrom) {
              expect(absoluteFrom).toBe(path.join(HELPER_DIR, 'file.txt'));

              return `${content}changed`;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can transform target path', (done) => {
      runEmit({
        expectedAssetKeys: ['subdir/test.txt'],
        patterns: [
          {
            from: 'file.txt',
            transformPath(targetPath, absoluteFrom) {
              expect(absoluteFrom).toBe(path.join(HELPER_DIR, 'file.txt'));

              return targetPath.replace('file.txt', 'subdir/test.txt');
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('warns when file not found', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedWarnings: [
          new Error(
            `unable to locate 'nonexistent.txt' at '${HELPER_DIR}${path.sep}nonexistent.txt'`
          ),
        ],
        patterns: [
          {
            from: 'nonexistent.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('warns when file not found and stats is undefined', (done) => {
      runEmit({
        compiler: new MockCompilerNoStat(),
        expectedAssetKeys: [],
        expectedWarnings: [
          new Error(
            `unable to locate 'nonexistent.txt' at '${HELPER_DIR}${path.sep}nonexistent.txt'`
          ),
        ],
        patterns: [
          {
            from: 'nonexistent.txt',
            to: '.',
            toType: 'dir',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('warns when tranform failed', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: ['a failure happened'],
        patterns: [
          {
            from: 'file.txt',
            transform() {
              // eslint-disable-next-line no-throw-literal
              throw 'a failure happened';
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('warns when tranformPath failed', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: ['a failure happened'],
        patterns: [
          {
            from: 'file.txt',
            transformPath() {
              // eslint-disable-next-line no-throw-literal
              throw 'a failure happened';
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('warns when pattern is empty', (done) => {
      runEmit({
        expectedAssetKeys: [
          '.file.txt',
          '[!]/hello.txt',
          '[special?directory]/(special-*file).txt',
          '[special?directory]/directoryfile.txt',
          '[special?directory]/nested/nestedfile.txt',
          'binextension.bin',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
          'directory/.dottedfile',
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          'file.txt',
          'file.txt.gz',
          'noextension',
        ],
        expectedErrors: [new Error(`path "from" cannot be empty string`)],
        patterns: [
          {
            from: '',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use an absolute path to move a file to the root directory', (done) => {
      const absolutePath = path.resolve(HELPER_DIR, 'file.txt');

      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: absolutePath,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new directory without a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to the root directory using an absolute to', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('allows absolute to if outpath is defined with webpack-dev-server', (done) => {
      runEmit({
        compiler: new MockCompiler({
          outputPath: '/',
          devServer: {
            outputPath: BUILD_DIR,
          },
        }),
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("throws an error when output path isn't defined with webpack-dev-server", (done) => {
      runEmit({
        compiler: new MockCompiler({
          outputPath: '/',
        }),
        skipAssetsTesting: true,
        expectedErrors: [
          new Error(
            'using older versions of webpack-dev-server, devServer.outputPath must be defined to write to absolute paths'
          ),
        ],
        patterns: [
          {
            from: 'file.txt',
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new directory using an absolute to', (done) => {
      runEmit({
        expectedAssetKeys: ['../tempdir/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: TEMP_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new file using an absolute to', (done) => {
      const absolutePath = path.resolve(TEMP_DIR, 'newfile.txt');

      runEmit({
        expectedAssetKeys: ['../tempdir/newfile.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: absolutePath,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new directory with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newdirectory/',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file with a context containing special characters', (done) => {
      runEmit({
        expectedAssetKeys: ['directoryfile.txt'],
        patterns: [
          {
            from: 'directoryfile.txt',
            context: '[special?directory]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file with special characters with a context containing special characters', (done) => {
      runEmit({
        expectedAssetKeys: ['(special-*file).txt'],
        patterns: [
          {
            from: '(special-*file).txt',
            context: '[special?directory]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new directory with an extension', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory.ext/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newdirectory.ext',
            toType: 'dir',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new directory with an extension and path separator at end', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory.ext/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: `newdirectory.ext${path.sep}`,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new file with a different name', (done) => {
      runEmit({
        expectedAssetKeys: ['newname.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newname.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file to a new file with no extension', (done) => {
      runEmit({
        expectedAssetKeys: ['newname'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newname',
            toType: 'file',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file without an extension to a file using a template', (done) => {
      runEmit({
        expectedAssetKeys: ['noextension.newext'],
        patterns: [
          {
            from: 'noextension',
            to: '[name][ext].newext',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file with a ".bin" extension using a template', (done) => {
      runEmit({
        expectedAssetKeys: ['binextension.bin'],
        patterns: [
          {
            from: 'binextension.bin',
            to: '[name].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a nested file to the root directory', (done) => {
      runEmit({
        expectedAssetKeys: ['directoryfile.txt'],
        patterns: [
          {
            from: 'directory/directoryfile.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use an absolute path to move a nested file to the root directory', (done) => {
      const absolutePath = path.resolve(
        HELPER_DIR,
        'directory',
        'directoryfile.txt'
      );

      runEmit({
        expectedAssetKeys: ['directoryfile.txt'],
        patterns: [
          {
            from: absolutePath,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a nested file to a new directory', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory/directoryfile.txt'],
        patterns: [
          {
            from: 'directory/directoryfile.txt',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can use an absolute path to move a nested file to a new directory', (done) => {
      const absolutePath = path.resolve(
        HELPER_DIR,
        'directory',
        'directoryfile.txt'
      );

      runEmit({
        expectedAssetKeys: ['newdirectory/directoryfile.txt'],
        patterns: [
          {
            from: absolutePath,
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("won't overwrite a file already in the compilation", (done) => {
      runForce({
        existingAsset: 'file.txt',
        expectedAssetContent: {
          'file.txt': 'existing',
        },
        patterns: [
          {
            from: 'file.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can force overwrite of a file already in the compilation', (done) => {
      runForce({
        existingAsset: 'file.txt',
        expectedAssetContent: {
          'file.txt': 'new',
        },
        patterns: [
          {
            force: true,
            from: 'file.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('adds the file to the watch list', (done) => {
      run({
        patterns: [
          {
            from: 'file.txt',
          },
        ],
      })
        .then((compilation) => {
          const absFrom = path.join(HELPER_DIR, 'file.txt');

          expect(Array.from(compilation.fileDependencies).sort()).toEqual(
            [absFrom].sort()
          );
        })
        .then(done)
        .catch(done);
    });

    it('only include files that have changed', (done) => {
      runChange({
        expectedAssetKeys: ['tempfile1.txt'],
        newFileLoc1: path.join(HELPER_DIR, 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'tempfile2.txt'),
        patterns: [
          {
            from: 'tempfile1.txt',
          },
          {
            from: 'tempfile2.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('ignores files in pattern', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[!]/hello.txt',
          'binextension.bin',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          '[special?directory]/directoryfile.txt',
          '[special?directory]/(special-*file).txt',
          '[special?directory]/nested/nestedfile.txt',
          'noextension',
        ],
        patterns: [
          {
            from: '**/*',
            ignore: ['file.*', 'file-in-nested-directory.*'],
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('allows pattern to contain name, hash or ext', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/directoryfile-22af64.txt'],
        patterns: [
          {
            from: 'directory/directoryfile.txt',
            to: 'directory/[name]-[hash:6].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('allows pattern to contain contenthash', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/22af64.txt'],
        patterns: [
          {
            from: 'directory/directoryfile.txt',
            to: 'directory/[contenthash:6].txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('allows pattern to contain custoh `contenthash` digest', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/c2a6.txt'],
        patterns: [
          {
            from: 'directory/directoryfile.txt',
            to: 'directory/[sha1:contenthash:hex:4].txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('allows pattern to contain `hashType` without `hash` or `contenthash`', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/[md5::base64:20].txt'],
        patterns: [
          {
            from: 'directory/directoryfile.txt',
            to: 'directory/[md5::base64:20].txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('transform with promise', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        expectedAssetContent: {
          'file.txt': 'newchanged!',
        },
        patterns: [
          {
            from: 'file.txt',
            transform(content) {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('transformPath with promise', (done) => {
      runEmit({
        expectedAssetKeys: ['/some/path/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            transformPath(targetPath, absoluteFrom) {
              expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

              return new Promise((resolve) => {
                resolve(`/some/path/${path.basename(targetPath)}`);
              });
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('same file to multiple targets', (done) => {
      runEmit({
        expectedAssetKeys: ['first/file.txt', 'second/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'first/file.txt',
          },
          {
            from: 'file.txt',
            to: 'second/file.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move a file (symbolic link) to the root directory', (done) => {
      // Windows doesn't support symbolic link
      runEmit({
        symlink: true,
        expectedAssetKeys: process.platform === 'win32' ? [] : ['file-ln.txt'],
        patterns: [
          {
            from: 'symlink/file-ln.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('with directory in from', () => {
    it("can move a directory's contents to the root directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can transform target path of every file in directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          '/some/path/.dottedfile',
          '/some/path/deepnested.txt',
          '/some/path/directoryfile.txt',
          '/some/path/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
            transformPath(targetPath, absoluteFrom) {
              expect(
                absoluteFrom.includes(path.join(HELPER_DIR, 'directory'))
              ).toBe(true);

              return `/some/path/${path.basename(targetPath)}`;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a directory's contents to the root directory using from with special characters", (done) => {
      runEmit({
        expectedAssetKeys: [
          'directoryfile.txt',
          '(special-*file).txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from:
              path.sep === '/' ? '[special?directory]' : '[specialdirectory]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a directory's contents to the root directory using context with special characters", (done) => {
      runEmit({
        expectedAssetKeys: [
          'directoryfile.txt',
          '(special-*file).txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: '.',
            context: '[special?directory]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('warns when directory not found', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedWarnings: [
          new Error(
            `unable to locate 'nonexistent' at '${HELPER_DIR}${path.sep}nonexistent'`
          ),
        ],
        patterns: [
          {
            from: 'nonexistent',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can use an absolute path to move a directory's contents to the root directory", (done) => {
      const absolutePath = path.resolve(HELPER_DIR, 'directory');

      runEmit({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: absolutePath,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a directory's contents to a new directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          'newdirectory/.dottedfile',
          'newdirectory/directoryfile.txt',
          'newdirectory/nested/deep-nested/deepnested.txt',
          'newdirectory/nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a directory's contents to a new directory using a pattern context", (done) => {
      runEmit({
        expectedAssetKeys: [
          'newdirectory/deep-nested/deepnested.txt',
          'newdirectory/nestedfile.txt',
        ],
        patterns: [
          {
            context: 'directory',
            from: 'nested',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can flatten a directory's contents to a new directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          'newdirectory/.dottedfile',
          'newdirectory/deepnested.txt',
          'newdirectory/directoryfile.txt',
          'newdirectory/nestedfile.txt',
        ],
        patterns: [
          {
            flatten: true,
            from: 'directory',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a directory's contents to a new directory using an absolute to", (done) => {
      runEmit({
        expectedAssetKeys: [
          '../tempdir/.dottedfile',
          '../tempdir/directoryfile.txt',
          '../tempdir/nested/deep-nested/deepnested.txt',
          '../tempdir/nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: TEMP_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a nested directory's contents to the root directory", (done) => {
      runEmit({
        expectedAssetKeys: ['deep-nested/deepnested.txt', 'nestedfile.txt'],
        patterns: [
          {
            from: 'directory/nested',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a nested directory's contents to a new directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          'newdirectory/deep-nested/deepnested.txt',
          'newdirectory/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory/nested',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can use an absolute path to move a nested directory's contents to a new directory", (done) => {
      const absolutePath = path.resolve(HELPER_DIR, 'directory', 'nested');

      runEmit({
        expectedAssetKeys: [
          'newdirectory/deep-nested/deepnested.txt',
          'newdirectory/nestedfile.txt',
        ],
        patterns: [
          {
            from: absolutePath,
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("won't overwrite a file already in the compilation", (done) => {
      runForce({
        existingAsset: 'directoryfile.txt',
        expectedAssetContent: {
          'directoryfile.txt': 'existing',
        },
        patterns: [
          {
            from: 'directory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can force overwrite of a file already in the compilation', (done) => {
      runForce({
        existingAsset: 'directoryfile.txt',
        expectedAssetContent: {
          'directoryfile.txt': 'new',
        },
        patterns: [
          {
            force: true,
            from: 'directory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('adds the context directory to the watch list', (done) => {
      run({
        patterns: [
          {
            from: 'directory',
          },
        ],
      })
        .then((compilation) => {
          const absFrom = path.resolve(HELPER_DIR, 'directory');
          expect(Array.from(compilation.contextDependencies).sort()).toEqual(
            [absFrom].sort()
          );
        })
        .then(done)
        .catch(done);
    });

    it('only include files that have changed', (done) => {
      runChange({
        expectedAssetKeys: ['tempfile1.txt'],
        newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'directory', 'tempfile2.txt'),
        patterns: [
          {
            from: 'directory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('include all files if copyUnmodified is true', (done) => {
      runChange({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
          'tempfile1.txt',
          'tempfile2.txt',
        ],
        newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'directory', 'tempfile2.txt'),
        options: {
          copyUnmodified: true,
        },
        patterns: [
          {
            from: 'directory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move multiple files to a non-root directory with name, hash and ext', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/.dottedfile-79d39f',
          'nested/directoryfile-22af64.txt',
          'nested/nested/deep-nested/deepnested-d41d8c.txt',
          'nested/nested/nestedfile-d41d8c.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: 'nested/[path][name]-[hash:6].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can move multiple files to a non-root directory with [1]', (done) => {
      runEmit({
        expectedAssetKeys: ['nested/txt'],
        patterns: [
          {
            from: 'directory/nested/deep-nested',
            to: 'nested/[1]',
            test: /\.([^.]*)$/,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("can move a directory's contents to the root directory from symbolic link", (done) => {
      runEmit({
        // Windows doesn't support symbolic link
        symlink: true,
        expectedAssetKeys:
          process.platform === 'win32'
            ? []
            : ['file.txt', 'nested-directory/file-in-nested-directory.txt'],
        patterns: [
          {
            from: 'symlink/directory-ln',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('with simple string patterns', () => {
    it('can move multiple files', (done) => {
      runEmit({
        expectedAssetKeys: ['binextension.bin', 'file.txt', 'noextension'],
        patterns: ['binextension.bin', 'file.txt', 'noextension'],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('with difference path segment separation', () => {
    it('can normalize backslash path with glob in from', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/nested/nestedfile.txt'],
        patterns: [
          {
            from: {
              glob: 'directory\\nested\\*',
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can normalize backslash path with glob in from (mixed path segment separation)', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/nested/nestedfile.txt'],
        patterns: [
          {
            from: {
              glob: 'directory/nested\\*',
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can normalize backslash path with glob in from (simple)', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/nested/nestedfile.txt'],
        patterns: [
          {
            from: 'directory\\nested\\*',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can exclude path', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[!]/hello.txt',
          '[special?directory]/(special-*file).txt',
          '[special?directory]/directoryfile.txt',
          '[special?directory]/nested/nestedfile.txt',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
        ],
        patterns: [
          {
            from: '!(directory)/**/*.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('can exclude path with backslash path', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[!]/hello.txt',
          '[special?directory]/(special-*file).txt',
          '[special?directory]/directoryfile.txt',
          '[special?directory]/nested/nestedfile.txt',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
        ],
        patterns: [
          {
            from: '!(directory)\\**\\*.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('modified files', () => {
    it('copy only changed files', (done) => {
      runChange({
        expectedAssetKeys: ['dest1/tempfile1.txt'],
        newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'directory', 'tempfile2.txt'),
        patterns: [
          {
            context: 'directory',
            from: '**/*.txt',
            to: 'dest1',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('copy only changed files (multiple patterns)', (done) => {
      runChange({
        expectedAssetKeys: ['dest1/tempfile1.txt', 'dest2/tempfile1.txt'],
        newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'directory', 'tempfile2.txt'),
        patterns: [
          {
            context: 'directory',
            from: '**/*.txt',
            to: 'dest1',
          },
          {
            context: 'directory',
            from: '**/*.txt',
            to: 'dest2',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('copy only changed files (multiple patterns with difference context)', (done) => {
      runChange({
        expectedAssetKeys: [
          'dest1/tempfile1.txt',
          'dest2/directory/tempfile1.txt',
        ],
        newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'tempfile2.txt'),
        patterns: [
          {
            context: 'directory',
            from: '**/*.txt',
            to: 'dest1',
          },
          {
            from: '**/*.txt',
            to: 'dest2',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('copy only changed files (multiple patterns with difference context 1)', (done) => {
      runChange({
        expectedAssetKeys: [
          'dest1/directory/tempfile1.txt',
          'dest2/tempfile1.txt',
        ],
        newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'tempfile2.txt'),
        patterns: [
          {
            from: '**/*.txt',
            to: 'dest1',
          },
          {
            context: 'directory',
            from: '**/*.txt',
            to: 'dest2',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('copy only changed files (multiple patterns with difference context 2)', (done) => {
      runChange({
        expectedAssetKeys: ['dest1/tempfile1.txt'],
        newFileLoc1: path.join(HELPER_DIR, 'tempfile1.txt'),
        newFileLoc2: path.join(HELPER_DIR, 'directory', 'tempfile2.txt'),
        patterns: [
          {
            from: '**/*.txt',
            to: 'dest1',
          },
          {
            context: 'directory',
            from: '**/*.txt',
            to: 'dest2',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('options', () => {
    describe('ignore', () => {
      it('ignores files when from is a file', (done) => {
        runEmit({
          expectedAssetKeys: ['directoryfile.txt'],
          options: {
            ignore: ['file.*'],
          },
          patterns: [
            {
              from: 'file.txt',
            },
            {
              from: 'directory/directoryfile.txt',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('ignores files when from is a directory', (done) => {
        runEmit({
          expectedAssetKeys: [
            '.dottedfile',
            'directoryfile.txt',
            'nested/deep-nested/deepnested.txt',
          ],
          options: {
            ignore: ['*/nestedfile.*'],
          },
          patterns: [
            {
              from: 'directory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('ignores files with a certain extension', (done) => {
        runEmit({
          expectedAssetKeys: ['.dottedfile'],
          options: {
            ignore: ['*.txt'],
          },
          patterns: [
            {
              from: 'directory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('ignores files that start with a dot', (done) => {
        runEmit({
          expectedAssetKeys: [
            '[!]/hello.txt',
            'binextension.bin',
            'dir (86)/file.txt',
            'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
            'dir (86)/nesteddir/nestedfile.txt',
            'file.txt',
            'file.txt.gz',
            'directory/directoryfile.txt',
            'directory/nested/deep-nested/deepnested.txt',
            'directory/nested/nestedfile.txt',
            '[special?directory]/directoryfile.txt',
            '[special?directory]/(special-*file).txt',
            '[special?directory]/nested/nestedfile.txt',
            'noextension',
          ],
          options: {
            ignore: ['.dottedfile', '.file.txt'],
          },
          patterns: [
            {
              from: '.',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('ignores all files except those with dots', (done) => {
        runEmit({
          expectedAssetKeys: ['.file.txt', 'directory/.dottedfile'],
          options: {
            ignore: [
              {
                dot: false,
                glob: '**/*',
              },
            ],
          },
          patterns: [
            {
              from: '.',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('ignores all files even if they start with a dot', (done) => {
        runEmit({
          expectedAssetKeys: [],
          options: {
            ignore: ['**/*'],
          },
          patterns: [
            {
              from: '.',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('ignores nested directory', (done) => {
        runEmit({
          expectedAssetKeys: [
            '.file.txt',
            '[!]/hello.txt',
            'binextension.bin',
            'dir (86)/file.txt',
            'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
            'dir (86)/nesteddir/nestedfile.txt',
            'file.txt',
            'file.txt.gz',
            'noextension',
          ],
          options: {
            ignore: [
              'directory/**/*',
              `[[]special${
                process.platform === 'win32' ? '' : '[?]'
              }directory]/**/*`,
            ],
          },
          patterns: [
            {
              from: '.',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      if (path.sep === '/') {
        it('ignores nested directory(can use "\\" to escape if path.sep is "/")', (done) => {
          runEmit({
            expectedAssetKeys: [
              '.file.txt',
              '[!]/hello.txt',
              'binextension.bin',
              'dir (86)/file.txt',
              'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
              'dir (86)/nesteddir/nestedfile.txt',
              'file.txt',
              'file.txt.gz',
              'noextension',
            ],
            options: {
              ignore: ['directory/**/*', '\\[special\\?directory\\]/**/*'],
            },
            patterns: [
              {
                from: '.',
              },
            ],
          })
            .then(done)
            .catch(done);
        });
      }

      it('ignores nested directory (glob)', (done) => {
        runEmit({
          expectedAssetKeys: ['.dottedfile', 'directoryfile.txt'],
          options: {
            ignore: ['nested/**/*'],
          },
          patterns: [
            {
              from: 'directory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });
    });

    describe('context', () => {
      it('overrides webpack config context with absolute path', (done) => {
        runEmit({
          expectedAssetKeys: [
            'newdirectory/deep-nested/deepnested.txt',
            'newdirectory/nestedfile.txt',
          ],
          options: {
            context: path.resolve(HELPER_DIR, 'directory'),
          },
          patterns: [
            {
              from: 'nested',
              to: 'newdirectory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('overrides webpack config context with relative path', (done) => {
        runEmit({
          expectedAssetKeys: [
            'newdirectory/deep-nested/deepnested.txt',
            'newdirectory/nestedfile.txt',
          ],
          options: {
            context: 'directory',
          },
          patterns: [
            {
              from: 'nested',
              to: 'newdirectory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('is overridden by pattern context', (done) => {
        runEmit({
          expectedAssetKeys: [
            'newdirectory/deep-nested/deepnested.txt',
            'newdirectory/nestedfile.txt',
          ],
          options: {
            context: 'directory',
          },
          patterns: [
            {
              context: 'nested',
              from: '.',
              to: 'newdirectory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });

      it('overrides webpack config context with absolute path', (done) => {
        runEmit({
          expectedAssetKeys: [
            'newdirectory/file.txt',
            'newdirectory/nesteddir/deepnesteddir/deepnesteddir.txt',
            'newdirectory/nesteddir/nestedfile.txt',
          ],
          options: {
            context: path.resolve(HELPER_DIR, 'dir (86)'),
          },
          patterns: [
            {
              from: '**/*',
              to: 'newdirectory',
            },
          ],
        })
          .then(done)
          .catch(done);
      });
    });

    describe('cache', () => {
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
  });
});
