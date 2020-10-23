import path from 'path';

import { runEmit } from './helpers/run';

const FIXTURES_DIR_NORMALIZED = path
  .join(__dirname, 'fixtures')
  .replace(/\\/g, '/');

describe('from option', () => {
  describe('is a file', () => {
    it('should move a file', (done) => {
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

    it('should move a file when "from" an absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: path.posix.join(FIXTURES_DIR_NORMALIZED, 'file.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file from nesting directory', (done) => {
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

    it('should move a file from nesting directory when "from" an absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['directoryfile.txt'],
        patterns: [
          {
            from: path.posix.join(
              FIXTURES_DIR_NORMALIZED,
              'directory/directoryfile.txt'
            ),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file (symbolic link)', (done) => {
      runEmit({
        symlink: true,
        expectedErrors:
          process.platform === 'win32'
            ? [
                new Error(
                  `unable to locate '${FIXTURES_DIR_NORMALIZED}/symlink/file-ln.txt' glob`
                ),
              ]
            : [],
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

    it('should throw an error on the missing file', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: [
          new Error(
            `unable to locate '${FIXTURES_DIR_NORMALIZED}/nonexistent.txt' glob`
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
  });

  describe('is a directory', () => {
    it('should move files', (done) => {
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

    it('should move files when "from" is current directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          '.file.txt',
          '[(){}[]!+@escaped-test^$]/hello.txt',
          '[special$directory]/(special-*file).txt',
          '[special$directory]/directoryfile.txt',
          '[special$directory]/nested/nestedfile.txt',
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
        patterns: [
          {
            from: '.',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files when "from" is relative path to context', (done) => {
      runEmit({
        expectedAssetKeys: [
          '.file.txt',
          '[(){}[]!+@escaped-test^$]/hello.txt',
          '[special$directory]/(special-*file).txt',
          '[special$directory]/directoryfile.txt',
          '[special$directory]/nested/nestedfile.txt',
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
        patterns: [
          {
            from: '../fixtures',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory/',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files from symbolic link', (done) => {
      runEmit({
        // Windows doesn't support symbolic link
        symlink: true,
        expectedErrors:
          process.platform === 'win32'
            ? [
                new Error(
                  `unable to locate '${FIXTURES_DIR_NORMALIZED}/symlink/directory-ln\\**\\*' glob`
                ),
              ]
            : [],
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

    it("should move files when 'from' is a absolute path", (done) => {
      runEmit({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: path.posix.join(FIXTURES_DIR_NORMALIZED, 'directory'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files when 'from' with special characters", (done) => {
      runEmit({
        expectedAssetKeys: [
          'directoryfile.txt',
          '(special-*file).txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from:
              path.sep === '/' ? '[special$directory]' : '[special$directory]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files from nested directory', (done) => {
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

    it('should move files from nested directory with an absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['deep-nested/deepnested.txt', 'nestedfile.txt'],
        patterns: [
          {
            from: path.posix.join(FIXTURES_DIR_NORMALIZED, 'directory/nested'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should throw an error on the missing directory', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: [
          new Error(
            `unable to locate '${FIXTURES_DIR_NORMALIZED}/nonexistent' glob`
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
  });

  describe('is a glob', () => {
    it('should move files', (done) => {
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

    it('should move files when a glob contains absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: path.posix.join(FIXTURES_DIR_NORMALIZED, '*.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files using globstar', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[(){}[]!+@escaped-test^$]/hello.txt',
          'binextension.bin',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
          'file.txt',
          'file.txt.gz',
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          '[special$directory]/directoryfile.txt',
          '[special$directory]/(special-*file).txt',
          '[special$directory]/nested/nestedfile.txt',
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

    it('should move files using globstar and contains an absolute path', (done) => {
      runEmit({
        expectedAssetKeys: [
          '[(){}[]!+@escaped-test^$]/hello.txt',
          'file.txt',
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
          '[special$directory]/directoryfile.txt',
          '[special$directory]/(special-*file).txt',
          '[special$directory]/nested/nestedfile.txt',
          'dir (86)/file.txt',
          'dir (86)/nesteddir/deepnesteddir/deepnesteddir.txt',
          'dir (86)/nesteddir/nestedfile.txt',
        ],
        patterns: [
          {
            from: path.posix.join(FIXTURES_DIR_NORMALIZED, '**/*.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files in nested directory using globstar', (done) => {
      runEmit({
        expectedAssetKeys: [
          'nested/[(){}[]!+@escaped-test^$]/hello-31d6cf.txt',
          'nested/binextension-31d6cf.bin',
          'nested/dir (86)/file-31d6cf.txt',
          'nested/dir (86)/nesteddir/deepnesteddir/deepnesteddir-31d6cf.txt',
          'nested/dir (86)/nesteddir/nestedfile-31d6cf.txt',
          'nested/file-5d7817.txt',
          'nested/file.txt-f18c8d.gz',
          'nested/directory/directoryfile-5d7817.txt',
          'nested/directory/nested/deep-nested/deepnested-31d6cf.txt',
          'nested/directory/nested/nestedfile-31d6cf.txt',
          'nested/[special$directory]/(special-*file)-517cf2.txt',
          'nested/[special$directory]/directoryfile-5d7817.txt',
          'nested/[special$directory]/nested/nestedfile-31d6cf.txt',
          'nested/noextension-31d6cf',
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

    it('should move files from nested directory', (done) => {
      runEmit({
        expectedAssetKeys: ['directory/directoryfile.txt'],
        patterns: [
          {
            from: 'directory/directory*.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files from nested directory #2', (done) => {
      runEmit({
        expectedAssetKeys: [
          'directory/directoryfile.txt',
          'directory/nested/deep-nested/deepnested.txt',
          'directory/nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory/**/*.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files using bracketed glob', (done) => {
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

    it('should move files (symbolic link)', (done) => {
      runEmit({
        // Windows doesn't support symbolic link
        symlink: true,
        expectedErrors:
          process.platform === 'win32'
            ? [
                new Error(
                  `unable to locate '${FIXTURES_DIR_NORMALIZED}/symlink\\**\\*.txt' glob`
                ),
              ]
            : [],
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

    it('should throw an error on the missing glob', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: [
          new Error(
            `unable to locate '${FIXTURES_DIR_NORMALIZED}/nonexistent/**/*' glob`
          ),
        ],
        patterns: [
          {
            from: 'nonexistent/**/*',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });
});
