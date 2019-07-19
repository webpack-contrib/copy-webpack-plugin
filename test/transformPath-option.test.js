import path from 'path';

import { runEmit } from './utils/run';

const HELPER_DIR = path.join(__dirname, 'helpers');

describe('transformPath option', () => {
  it('should transform target path when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ['subdir/test.txt'],
      patterns: [
        {
          from: 'file.txt',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom).toBe(path.join(HELPER_DIR, 'file.txt'));

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
              absoluteFrom.includes(path.join(HELPER_DIR, 'directory'))
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
        '/some/path/(special-*file).txt.tst',
        '/some/path/binextension.bin.tst',
        '/some/path/deepnested.txt.tst',
        '/some/path/deepnesteddir.txt.tst',
        '/some/path/file.txt.tst',
        '/some/path/file.txt.gz.tst',
        '/some/path/directoryfile.txt.tst',
        '/some/path/nestedfile.txt.tst',
        '/some/path/noextension.tst',
        '/some/path/hello.txt.tst',
      ],
      patterns: [
        {
          from: '**/*',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

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
            expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

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
            expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

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

  it('should warns when function throw error', (done) => {
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

  it('should warns when Promise was rejected', (done) => {
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

  it('should warns when async function throw error', (done) => {
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
        'transformed/[!]/hello-d41d8c.txt',
        'transformed/[special?directory]/directoryfile-22af64.txt',
        'transformed/[special?directory]/(special-*file)-0bd650.txt',
        'transformed/[special?directory]/nested/nestedfile-d41d8c.txt',
        'transformed/binextension-d41d8c.bin',
        'transformed/dir (86)/file-d41d8c.txt',
        'transformed/dir (86)/nesteddir/deepnesteddir/deepnesteddir-d41d8c.txt',
        'transformed/dir (86)/nesteddir/nestedfile-d41d8c.txt',
        'transformed/file-22af64.txt',
        'transformed/file.txt-5b311c.gz',
        'transformed/directory/directoryfile-22af64.txt',
        'transformed/directory/nested/deep-nested/deepnested-d41d8c.txt',
        'transformed/directory/nested/nestedfile-d41d8c.txt',
        'transformed/noextension-d41d8c',
      ],
      patterns: [
        {
          from: '**/*',
          to: 'nested/[path][name]-[hash:6].[ext]',
          transformPath(targetPath, absoluteFrom) {
            expect(absoluteFrom.includes(HELPER_DIR)).toBe(true);

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
