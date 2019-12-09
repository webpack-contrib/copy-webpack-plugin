import path from 'path';

import { runEmit } from './helpers/run';
import { MockCompilerNoStat } from './helpers/mocks';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('toType option', () => {
  it('should move a file to a new file', (done) => {
    runEmit({
      expectedAssetKeys: ['new-file.txt'],
      patterns: [
        {
          from: 'file.txt',
          to: 'new-file.txt',
          toType: 'file',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should move a file to a new directory', (done) => {
    runEmit({
      expectedAssetKeys: ['new-file.txt/file.txt'],
      patterns: [
        {
          from: 'file.txt',
          to: 'new-file.txt',
          toType: 'dir',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should move a file to a new directory', (done) => {
    runEmit({
      expectedAssetKeys: [
        'directory/directorynew-directoryfile.txt.22af645d1859cb5ca6da0c484f1f37ea.22af645d1859cb5ca6da0c484f1f37ea.22af645d.22af645d.txt',
      ],
      patterns: [
        {
          from: 'directory/directoryfile.*',
          to:
            '[path][folder]new-[name].[ext].[hash].[contenthash].[md5:contenthash:hex:8].[md5:hash:hex:8].txt',
          toType: 'template',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should move a file to a new file with no extension', (done) => {
    runEmit({
      expectedAssetKeys: ['newname'],
      patterns: [
        {
          from: 'file.txt',
          to: 'newname',
          toType: 'file',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should move a file to a new directory with an extension', (done) => {
    runEmit({
      expectedAssetKeys: ['newdirectory.ext/file.txt'],
      patterns: [
        {
          from: 'file.txt',
          to: 'newdirectory.ext',
          toType: 'dir',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should warn when file not found and stats is undefined', (done) => {
    runEmit({
      compiler: new MockCompilerNoStat(),
      expectedAssetKeys: [],
      expectedWarnings: [
        new Error(
          `unable to locate 'nonexistent.txt' at '${FIXTURES_DIR}${path.sep}nonexistent.txt'`
        ),
      ],
      patterns: [
        {
          from: 'nonexistent.txt',
          to: '.',
          toType: 'dir',
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
