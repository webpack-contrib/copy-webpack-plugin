import path from 'path';

import { runEmit } from './helpers/run';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

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
            from: path.join(FIXTURES_DIR, 'file.txt'),
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
            from: path.join(FIXTURES_DIR, 'directory/directoryfile.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file (symbolic link)', (done) => {
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

    it('should warn when file not found', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedWarnings: [
          new Error(
            `unable to locate 'nonexistent.txt' at '${FIXTURES_DIR}${path.sep}nonexistent.txt'`
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
            from: path.join(FIXTURES_DIR, 'directory'),
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
              path.sep === '/' ? '[special?directory]' : '[specialdirectory]',
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
            from: path.join(FIXTURES_DIR, 'directory/nested'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should warn when directory not found', (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedWarnings: [
          new Error(
            `unable to locate 'nonexistent' at '${FIXTURES_DIR}${path.sep}nonexistent'`
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
            from: path.join(FIXTURES_DIR, '*.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files using globstar', (done) => {
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

    it('should move files using globstar and contains an absolute path', (done) => {
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
            from: path.join(FIXTURES_DIR, '**/*.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files in nested directory using globstar', (done) => {
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

  describe('is a object with glob and glob options', () => {
    it('should move files', (done) => {
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

    it('should move files exclude dot files', (done) => {
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

    it('should move files with dot files', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt', '.file.txt'],
        patterns: [
          {
            from: {
              glob: '*.txt',
              dot: true,
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files with the "globOptions" option', (done) => {
      runEmit({
        expectedAssetKeys: ['.file.txt', 'file.txt'],
        patterns: [
          {
            from: '*.txt',
            globOptions: {
              dot: true,
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files with the "globOptions" option #2', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: '*.txt',
            globOptions: {
              dot: false,
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });
});
