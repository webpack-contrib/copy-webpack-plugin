import path from 'path';

import { runEmit } from './utils/run';
import { MockCompilerNoStat } from './utils/mock';

const HELPER_DIR = path.join(__dirname, 'helpers');

describe('toType option', () => {
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

  it('should warns when file not found and stats is undefined', (done) => {
    runEmit({
      compiler: new MockCompilerNoStat(),
      expectedAssetKeys: [],
      expectedWarnings: [
        new Error(
          `unable to locate 'nonexistent.txt' at '${HELPER_DIR}${path.sep}nonexistent.txt'`
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
