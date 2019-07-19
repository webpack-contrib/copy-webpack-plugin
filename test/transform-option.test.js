import path from 'path';

import { runEmit } from './utils/run';

const HELPER_DIR = path.join(__dirname, 'helpers');

describe('transform option', () => {
  it('should transform content of a file', (done) => {
    runEmit({
      expectedAssetKeys: ['file.txt'],
      expectedAssetContent: {
        'file.txt': 'newchanged',
      },
      patterns: [
        {
          from: 'file.txt',
          transform(content, absoluteFrom) {
            expect(absoluteFrom).toBe(path.join(HELPER_DIR, 'file.txt'));

            return `${content}changed`;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should works with Promise', (done) => {
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

  it('should warns when function throw error', (done) => {
    runEmit({
      expectedAssetKeys: [],
      expectedErrors: ['a failure happened'],
      patterns: [
        {
          from: 'file.txt',
          transform() {
            // eslint-disable-next-line no-throw-literal
            throw 'a failure happened';
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
