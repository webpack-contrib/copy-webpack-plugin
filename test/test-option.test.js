import { runEmit } from './utils/run';

describe('test option', () => {
  it('should move multiple files to a non-root directory with [1]', (done) => {
    runEmit({
      expectedAssetKeys: ['nested/txt'],
      patterns: [
        {
          from: 'directory/nested/deep-nested',
          to: 'nested/[1]',
          test: /\.([^.]*)$/,
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
