import path from 'path';

import { runEmit } from './utils/run';

const HELPER_DIR = path.join(__dirname, 'helpers');

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

    it('should move a file when from an absolute path', (done) => {
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

    it('should warn when file not found', (done) => {
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

    it('should warn when pattern is empty', (done) => {
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
          'watch/.gitkeep',
          'watch/directory/.gitkeep',
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
            from: path.resolve(HELPER_DIR, 'directory'),
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

    it('should warn when directory not found', (done) => {
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
  });
});
