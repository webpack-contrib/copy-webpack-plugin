import path from 'path';
import del from 'del';
import webpack from 'webpack';

export default function (name, config = {}) {
  return del(path.resolve(__dirname, `../__expected__/${name}`)).then(() => {
    config = {
      target: config.target || 'web',
      context: path.resolve(__dirname, '../fixtures'),
      entry: `./${name}/entry.js`,
      output: {
        path: path.resolve(__dirname, `../__expected__/${name}`),
        filename: 'bundle.js',
      },
      module: {
        rules: [
          {
            test: config.loader ? config.loader.test : /worker\.js$/,
            use: {
              loader: '../../src',
              options: config.loader ? config.loader.options : {},
            },
          },
        ],
      },
    };

    const compiler = webpack(config);

    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) reject(err);

        resolve(stats);
      });
    });
  });
}
