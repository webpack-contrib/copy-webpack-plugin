import path from 'path';

import { runEmit } from './utils/run';

describe('ignore option', () => {
  it('should ignores files when from is a directory', (done) => {
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

  it('should ignores files when from is glob pattern', (done) => {
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

  it('should ignores nested directory when from is a directory', (done) => {
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

  it('should ignores all files except those with dots', (done) => {
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

  it('should ignores all files even if they start with a dot', (done) => {
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

  it('should ignores files with a certain extension', (done) => {
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

  it('should ignores files that start with a dot', (done) => {
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

  it('should ignores nested directory', (done) => {
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

  it('should ignores files when from is a file (global)', (done) => {
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
});
