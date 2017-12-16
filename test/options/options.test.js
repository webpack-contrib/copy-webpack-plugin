import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('boilerplate', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.js$/,
          options: { boilerplate: true },
        },
      };

      const stats = await webpack('fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
