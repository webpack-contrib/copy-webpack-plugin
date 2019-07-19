import path from 'path';

import { runEmit } from './utils/run';

describe('flatten option', () => {
  it("should flatten a directory's contents to a new directory", (done) => {
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

  // Todo test using file and glob without context

  it('should works when use a glob to flatten multiple files in a relative context to a non-root directory', (done) => {
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

  it('should flatten or normalize glob matches', (done) => {
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
});
