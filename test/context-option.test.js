import path from 'path';

import { runEmit } from './helpers/run';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('context option', () => {
  it('should work when "from" is a file and "context" is a relative path', (done) => {
    runEmit({
      expectedAssetKeys: ['directoryfile.txt'],
      patterns: [
        {
          from: 'directoryfile.txt',
          context: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a directory and "context" is a relative path', (done) => {
    runEmit({
      expectedAssetKeys: ['deep-nested/deepnested.txt', 'nestedfile.txt'],
      patterns: [
        {
          from: 'nested',
          context: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a glob and "context" is a relative path', (done) => {
    runEmit({
      expectedAssetKeys: [
        'nested/deep-nested/deepnested.txt',
        'nested/nestedfile.txt',
      ],
      patterns: [
        {
          from: 'nested/**/*',
          context: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a file and "context" is an absolute path', (done) => {
    runEmit({
      expectedAssetKeys: ['directoryfile.txt'],
      patterns: [
        {
          from: 'directoryfile.txt',
          context: path.join(FIXTURES_DIR, 'directory'),
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a directory and "context" is an absolute path', (done) => {
    runEmit({
      expectedAssetKeys: ['deep-nested/deepnested.txt', 'nestedfile.txt'],
      patterns: [
        {
          from: 'nested',
          context: path.join(FIXTURES_DIR, 'directory'),
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a glob and "context" is an absolute path', (done) => {
    runEmit({
      expectedAssetKeys: [
        'nested/deep-nested/deepnested.txt',
        'nested/nestedfile.txt',
      ],
      patterns: [
        {
          from: 'nested/**/*',
          context: path.join(FIXTURES_DIR, 'directory'),
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a file and "context" with special characters', (done) => {
    runEmit({
      expectedAssetKeys: ['directoryfile.txt'],
      patterns: [
        {
          from: 'directoryfile.txt',
          context: '[special$directory]',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a directory and "context" with special characters', (done) => {
    runEmit({
      expectedAssetKeys: [
        'directoryfile.txt',
        '(special-*file).txt',
        'nested/nestedfile.txt',
      ],
      patterns: [
        {
          // Todo strange behavour when you use `FIXTURES_DIR`, need investigate for next major release
          from: '.',
          context: '[special$directory]',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a glob and "context" with special characters', (done) => {
    runEmit({
      expectedAssetKeys: [
        'directoryfile.txt',
        '(special-*file).txt',
        'nested/nestedfile.txt',
      ],
      patterns: [
        {
          from: '**/*',
          context: '[special$directory]',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a glob and "context" with special characters #2', (done) => {
    runEmit({
      expectedAssetKeys: ['(special-*file).txt'],
      patterns: [
        {
          from: '\\(special-*file\\).txt',
          context: '[special$directory]',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a file and "to" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: ['newdirectory/directoryfile.txt'],
      patterns: [
        {
          context: 'directory',
          from: 'directoryfile.txt',
          to: 'newdirectory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "from" is a directory and "to" is a directory', (done) => {
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

  it('should work when "from" is a glob and "to" is a directory', (done) => {
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
});
