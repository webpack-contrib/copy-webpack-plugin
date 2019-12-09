import { runEmit } from './helpers/run';

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
