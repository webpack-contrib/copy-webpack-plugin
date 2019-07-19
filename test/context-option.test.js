import path from 'path';

import { runEmit } from './utils/run';

const HELPER_DIR = path.join(__dirname, 'helpers');

describe('context option', () => {
  it('should overrides webpack config context with a relative path', (done) => {
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

  it('should overrides webpack config context with an absolute path', (done) => {
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

  it('should overrides by pattern context with a relative path', (done) => {
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

  it('should overrides by pattern context with an absolute path', (done) => {
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
          context: 'nested',
          from: '.',
          to: 'newdirectory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should overrides webpack config context with a relative path with space in directory name', (done) => {
    runEmit({
      expectedAssetKeys: [
        'newdirectory/file.txt',
        'newdirectory/nesteddir/deepnesteddir/deepnesteddir.txt',
        'newdirectory/nesteddir/nestedfile.txt',
      ],
      options: {
        context: 'dir (86)',
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

  it('should overrides webpack config context with an absolute path with space in directory name', (done) => {
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

  it('should move a file with a context containing special characters', (done) => {
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

  it('should move a file with special characters with a context containing special characters', (done) => {
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
});
