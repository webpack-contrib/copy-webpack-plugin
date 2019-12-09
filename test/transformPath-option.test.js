import path from 'path';

import { runEmit } from './helpers/run';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('transformPath option', () => {
  it('should transform target path when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ['subdir/test.txt'],
      patterns: [
        {
          from: 'file.txt',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom).toBe(path.join(FIXTURES_DIR, 'file.txt'));

            return targetPath.replace('file.txt', 'subdir/test.txt');
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
        '/some/path/.dottedfile',
        '/some/path/deepnested.txt',
        '/some/path/directoryfile.txt',
        '/some/path/nestedfile.txt',
      ],
      patterns: [
        {
          from: 'directory',
          transformPath(targetPath, absoluteFrom) {
            expect(
              absoluteFrom.includes(path.join(FIXTURES_DIR, 'directory'))
            ).toBe(true);

            return `/some/path/${path.basename(targetPath)}`;
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
        '/some/path/deepnested.txt.tst',
        '/some/path/directoryfile.txt.tst',
        '/some/path/nestedfile.txt.tst',
      ],
      patterns: [
        {
          from: 'directory/**/*',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            return `/some/path/${path.basename(targetPath)}.tst`;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should transform target path when function return Promise', (done) => {
    runEmit({
      expectedAssetKeys: ['/some/path/file.txt'],
      patterns: [
        {
          from: 'file.txt',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            return new Promise((resolve) => {
              resolve(`/some/path/${path.basename(targetPath)}`);
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
      expectedAssetKeys: ['/some/path/file.txt'],
      patterns: [
        {
          from: 'file.txt',
          async transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            const newPath = await new Promise((resolve) => {
              resolve(`/some/path/${path.basename(targetPath)}`);
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
          transformPath() {
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
          transformPath() {
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
          async transformPath() {
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

  it('should transform target path of every file in glob after applying template', (done) => {
    runEmit({
      expectedAssetKeys: [
        'transformed/directory/directoryfile-22af64.txt',
        'transformed/directory/nested/deep-nested/deepnested-d41d8c.txt',
        'transformed/directory/nested/nestedfile-d41d8c.txt',
      ],
      patterns: [
        {
          from: 'directory/**/*',
          to: 'nested/[path][name]-[hash:6].[ext]',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            return targetPath.replace(
              `nested${path.sep}`,
              `transformed${path.sep}`
            );
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
