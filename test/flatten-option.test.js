import { runEmit } from './helpers/run';

describe('flatten option', () => {
  it('should flatten a directory\'s files to a root directory when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ['directoryfile.txt'],
      patterns: [
        {
          flatten: true,
          from: 'directory/directoryfile.txt',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should flatten a directory\'s files to a new directory when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ['nested/directoryfile.txt'],
      patterns: [
        {
          flatten: true,
          from: 'directory/directoryfile.txt',
          to: 'nested',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should flatten a directory\'s files to a root directory when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [
        '.dottedfile',
        'deepnested.txt',
        'directoryfile.txt',
        'nestedfile.txt',
      ],
      patterns: [
        {
          flatten: true,
          from: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should flatten a directory\'s files to new directory when "from" is a directory', (done) => {
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

  it('should flatten a directory\'s files to a root directory when "from" is a glob', (done) => {
    runEmit({
      expectedAssetKeys: [
        'deepnested.txt',
        'directoryfile.txt',
        'nestedfile.txt',
      ],
      patterns: [
        {
          flatten: true,
          from: 'directory/**/*',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should flatten a directory\'s files to a new directory when "from" is a glob', (done) => {
    runEmit({
      expectedAssetKeys: [
        'nested/deepnested.txt',
        'nested/directoryfile.txt',
        'nested/nestedfile.txt',
      ],
      patterns: [
        {
          flatten: true,
          from: 'directory/**/*',
          to: 'nested',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should flatten files in a relative context to a root directory when "from" is a glob', (done) => {
    runEmit({
      expectedAssetKeys: [
        'deepnested.txt',
        'directoryfile.txt',
        'nestedfile.txt',
      ],
      patterns: [
        {
          context: 'directory',
          flatten: true,
          from: '**/*',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should flatten files in a relative context to a non-root directory when "from" is a glob', (done) => {
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
});
