import path from 'path';

import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';

export default (config = {}) => {
  const fullConfig = {
    mode: 'development',
    context: path.resolve(__dirname, '../fixtures'),
    entry: path.resolve(__dirname, '../helpers/enter.js'),
    output: {
      path: path.resolve(__dirname, '../build'),
    },
    module: {
      rules: [
        {
          test: /\.txt/,
          type: 'asset/resource',
        },
      ],
    },
    ...config,
  };

  if (webpack.version[0] === 5) {
    fullConfig.stats.source = true;
  }

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    const outputFileSystem = createFsFromVolume(new Volume());
    // Todo remove when we drop webpack@4 support
    outputFileSystem.join = path.join.bind(path);

    compiler.outputFileSystem = outputFileSystem;
  }

  return compiler;
};
