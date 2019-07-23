import path from 'path';

import { runEmit } from './utils/run';

const BUILD_DIR = path.join(__dirname, 'build');
const TEMP_DIR = path.join(__dirname, 'tempdir');

describe('to option', () => {
  describe('is a file', () => {
    it('should a file to a new file when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['newfile.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newfile.txt',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should a file to a new file when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['../tempdir/newfile.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: path.resolve(TEMP_DIR, 'newfile.txt'),
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('is a directory', () => {
    it('should move a file to a new directory', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory out of context', (done) => {
      runEmit({
        expectedAssetKeys: ['../tempdir/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: TEMP_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: ['newdirectory/file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: 'newdirectory/',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory when "to" is absolute path with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: ['file.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: `${BUILD_DIR}/`,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files to a new directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          'newdirectory/.dottedfile',
          'newdirectory/directoryfile.txt',
          'newdirectory/nested/deep-nested/deepnested.txt',
          'newdirectory/nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: 'newdirectory',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files to a new directory when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files to a new directory when "to" is absolute path with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: [
          '.dottedfile',
          'directoryfile.txt',
          'nested/deep-nested/deepnested.txt',
          'nested/nestedfile.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: `${BUILD_DIR}/`,
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('is a template', () => {
    it('should file with name, contenthash and ext', (done) => {
      runEmit({
        expectedAssetKeys: ['file-22af64.txt'],
        patterns: [
          {
            from: 'file.txt',
            to: '[name]-[contenthash:6].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files with path, name, contenthash and ext', (done) => {
      runEmit({
        expectedAssetKeys: [
          'newdirectory/.dottedfile-79d39f',
          'newdirectory/directoryfile-22af64.txt',
          'newdirectory/nested/deep-nested/deepnested-d41d8c.txt',
          'newdirectory/nested/nestedfile-d41d8c.txt',
        ],
        patterns: [
          {
            from: 'directory',
            to: 'newdirectory/[path][name]-[contenthash:6].[ext]',
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });
});
