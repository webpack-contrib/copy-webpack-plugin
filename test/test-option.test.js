import path from 'path';

import { runEmit } from './helpers/run';

describe('test option', () => {
  it('should move files to a root directory with [1]', (done) => {
    runEmit({
      expectedAssetKeys: ['txt'],
      patterns: [
        {
          from: 'directory/nested/deep-nested',
          to: '[1]',
          test: /\.([^.]*)$/,
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should move files to a non-root directory with [1]', (done) => {
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

  it('should move files and flatten them to a non-root directory with [1]-[2].[ext]', (done) => {
    runEmit({
      expectedAssetKeys: [
        'nested/deep-nested-deepnested.txt',
        'nested/directory-directoryfile.txt',
        'nested/nested-nestedfile.txt',
      ],
      patterns: [
        {
          from: 'directory/**/*',
          test: `([^\\${path.sep}]+)\\${path.sep}([^\\${path.sep}]+)\\.\\w+$`,
          to: 'nested/[1]-[2].[ext]',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should move files and flatten them to a root directory with [1]-[2].[ext]', (done) => {
    runEmit({
      expectedAssetKeys: [
        'deep-nested-deepnested.txt',
        'directory-directoryfile.txt',
        'nested-nestedfile.txt',
      ],
      patterns: [
        {
          from: 'directory/**/*',
          test: `([^\\${path.sep}]+)\\${path.sep}([^\\${path.sep}]+)\\.\\w+$`,
          to: '[1]-[2].[ext]',
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
