import path from 'path';

import { runEmit } from './helpers/run';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('from option', () => {
  it('should move files exclude dot files', (done) => {
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

  it('should move files include dot files', (done) => {
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
});

describe('globOptions ignore option', () => {
  it('should ignore files when "from" is a file', (done) => {
    runEmit({
      expectedWarnings: [
        new Error(
          `unable to locate 'file.txt' at '${FIXTURES_DIR}${path.sep}file.txt'`
        ),
      ],
      patterns: [
        {
          from: 'file.txt',
          globOptions: {
            ignore: ['**/file.*'],
          },
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
          from: 'directory',
          globOptions: {
            ignore: ['**/nestedfile.*'],
          },
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
          from: 'directory',
          globOptions: {
            ignore: ['**/nested/**'],
          },
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
          from: 'directory/**/*',
          globOptions: {
            ignore: ['**/nestedfile.*'],
          },
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
          from: 'directory/**/*',
          globOptions: {
            ignore: ['**/nested/**'],
          },
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
          from: 'directory',
          globOptions: {
            ignore: ['**/*.txt'],
          },
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
          from: 'directory/**/*',
          globOptions: {
            ignore: ['**/directoryfile.*', '**/deep-nested/**'],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files with flatten true', (done) => {
    runEmit({
      expectedAssetKeys: ['img/.dottedfile', 'img/nestedfile.txt'],
      patterns: [
        {
          from: 'directory/',
          to: 'img/',
          flatten: true,
          globOptions: {
            ignore: ['**/directoryfile.*', '**/deep-nested/**'],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files except those with dots', (done) => {
    runEmit({
      expectedAssetKeys: ['.dottedfile'],
      patterns: [
        {
          from: 'directory',
          globOptions: {
            ignore: ['!(**/.*)'],
          },
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
          from: 'directory',
          globOptions: {
            ignore: ['**/.*'],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignores all files even if they start with a dot', (done) => {
    runEmit({
      expectedWarnings: [
        new Error(
          `unable to locate 'directory' at '${FIXTURES_DIR}${path.sep}directory${path.sep}**${path.sep}*'`
        ),
      ],
      patterns: [
        {
          from: 'directory',
          globOptions: {
            ignore: ['**/*'],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files when "from" is a file (global ignore)', (done) => {
    runEmit({
      expectedWarnings: [
        new Error(
          `unable to locate 'file.txt' at '${FIXTURES_DIR}${path.sep}file.txt'`
        ),
      ],
      patterns: [
        {
          from: 'file.txt',
          globOptions: {
            ignore: ['**/file.*'],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
