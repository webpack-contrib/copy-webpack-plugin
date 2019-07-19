import fs from 'fs';
import path from 'path';

import mkdirp from 'mkdirp';

import CopyPlugin from '../src/index';

import removeIllegalCharacterForWindows from './utils/removeIllegalCharacterForWindows';

import { MockCompiler } from './utils/mock';
import { run, runEmit, runChange } from './utils/run';

const BUILD_DIR = path.join(__dirname, 'build');
const HELPER_DIR = path.join(__dirname, 'helpers');
const TEMP_DIR = path.join(__dirname, 'tempdir');

describe('apply function', () => {
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
});
