import { runForce } from './utils/run';

describe('force option', () => {
  it('should overwrite of a file already in the compilation', (done) => {
    runForce({
      existingAsset: 'file.txt',
      expectedAssetContent: {
        'file.txt': 'new',
      },
      patterns: [
        {
          force: true,
          from: 'file.txt',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should not overwrite a file already in the compilation', (done) => {
    runForce({
      existingAsset: 'file.txt',
      expectedAssetContent: {
        'file.txt': 'existing',
      },
      patterns: [
        {
          force: false,
          from: 'file.txt',
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should not overwrite a file already in the compilation #2', (done) => {
    runForce({
      existingAsset: 'file.txt',
      expectedAssetContent: {
        'file.txt': 'existing',
      },
      patterns: [
        {
          from: 'file.txt',
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
