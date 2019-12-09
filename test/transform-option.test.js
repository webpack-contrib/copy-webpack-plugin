import path from 'path';

import { runEmit } from './helpers/run';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('transform option', () => {
  it('should transform file when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': 'newchanged',
      },
      patterns: [
        {
          from: 'file.txt',
          transform(content, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            return `${content}changed`;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should transform target path of every when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [
        '.dottedfile',
        'directoryfile.txt',
        'nested/deep-nested/deepnested.txt',
        'nested/nestedfile.txt',
      ],
      expectedAssetContent: {
        '.dottedfile': 'dottedfile contents\nchanged',
        'directoryfile.txt': 'newchanged',
        'nested/deep-nested/deepnested.txt': 'changed',
        'nested/nestedfile.txt': 'changed',
      },
      patterns: [
        {
          from: 'directory',
          transform(content, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            return `${content}changed`;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should transform target path of every file when "from" is a glob', (done) => {
    runEmit({
      expectedAssetKeys: [
        'directory/directoryfile.txt',
        'directory/nested/deep-nested/deepnested.txt',
        'directory/nested/nestedfile.txt',
      ],
      expectedAssetContent: {
        'directory/directoryfile.txt': 'newchanged',
        'directory/nested/deep-nested/deepnested.txt': 'changed',
        'directory/nested/nestedfile.txt': 'changed',
      },
      patterns: [
        {
          from: 'directory/**/*',
          transform(content, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            return `${content}changed`;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should transform file when function return Promise', (done) => {
    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': 'newchanged!',
      },
      patterns: [
        {
          from: 'file.txt',
          transform(content) {
            return new Promise((resolve) => {
              resolve(`${content}changed!`);
            });
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should transform target path when async function used', (done) => {
    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': 'newchanged!',
      },
      patterns: [
        {
          from: 'file.txt',
          async transform(content) {
            const newPath = await new Promise((resolve) => {
              resolve(`${content}changed!`);
            });

            return newPath;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should warn when function throw error', (done) => {
    runEmit({
      expectedAssetKeys: [],
      expectedErrors: [new Error('a failure happened')],
      patterns: [
        {
          from: 'file.txt',
          transform() {
            // eslint-disable-next-line no-throw-literal
            throw new Error('a failure happened');
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should warn when Promise was rejected', (done) => {
    runEmit({
      expectedAssetKeys: [],
      expectedErrors: [new Error('a failure happened')],
      patterns: [
        {
          from: 'file.txt',
          transform() {
            return new Promise((resolve, reject) => {
              return reject(new Error('a failure happened'));
            });
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should warn when async function throw error', (done) => {
    runEmit({
      expectedAssetKeys: [],
      expectedErrors: [new Error('a failure happened')],
      patterns: [
        {
          from: 'file.txt',
          async transform() {
            await new Promise((resolve, reject) => {
              reject(new Error('a failure happened'));
            });
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
