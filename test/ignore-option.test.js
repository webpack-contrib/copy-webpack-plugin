import { runEmit } from './helpers/run';

describe('ignore option', () => {
  it('should ignore files when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: [],
      patterns: [
        {
          ignore: ['file.*'],
          from: 'file.txt',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should files when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [
        '.dottedfile',
        'directoryfile.txt',
        'nested/deep-nested/deepnested.txt',
      ],
      patterns: [
        {
          ignore: ['*/nestedfile.*'],
          from: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should files in nested directory when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: ['.dottedfile', 'directoryfile.txt'],
      patterns: [
        {
          ignore: ['**/nested/**'],
          from: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should files when from is a glob', (done) => {
    runEmit({
      expectedAssetKeys: [
        'directory/directoryfile.txt',
        'directory/nested/deep-nested/deepnested.txt',
      ],
      patterns: [
        {
          ignore: ['*nestedfile.*'],
          from: 'directory/**/*',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should files in nested directory when from is a glob', (done) => {
    runEmit({
      expectedAssetKeys: ['directory/directoryfile.txt'],
      patterns: [
        {
          ignore: ['*/nested/**'],
          from: 'directory/**/*',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files with a certain extension', (done) => {
    runEmit({
      expectedAssetKeys: ['.dottedfile'],
      patterns: [
        {
          ignore: ['*.txt'],
          from: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files with multiple ignore patterns', (done) => {
    runEmit({
      expectedAssetKeys: ['directory/nested/nestedfile.txt'],
      patterns: [
        {
          ignore: ['directoryfile.*', '**/deep-nested/**'],
          from: 'directory/**/*',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files except those with dots', (done) => {
    runEmit({
      expectedAssetKeys: ['.dottedfile'],
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
          from: 'directory',
          ignore: [
            {
              dot: false,
              glob: '**/*',
            },
          ],
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files that start with a dot', (done) => {
    runEmit({
      expectedAssetKeys: [
        'directoryfile.txt',
        'nested/deep-nested/deepnested.txt',
        'nested/nestedfile.txt',
      ],
      patterns: [
        {
          ignore: ['.dottedfile'],
          from: 'directory',
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
          from: 'directory',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files when "from" is a file (global ignore)', (done) => {
    runEmit({
      expectedAssetKeys: [],
      options: {
        ignore: ['file.*'],
      },
      patterns: [
        {
          ignore: ['file.*'],
          from: 'file.txt',
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
