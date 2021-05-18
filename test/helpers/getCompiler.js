import path from "path";

// eslint-disable-next-line import/no-extraneous-dependencies
import webpack from "webpack";
// eslint-disable-next-line import/no-extraneous-dependencies
import { createFsFromVolume, Volume } from "memfs";

export default (config = {}) => {
  const fullConfig = {
    mode: "development",
    context: path.resolve(__dirname, "../fixtures"),
    entry: path.resolve(__dirname, "../helpers/enter.js"),
    output: {
      path: path.resolve(__dirname, "../build"),
    },
    module: {
      rules: [
        {
          test: /\.txt/,
          type: "asset/resource",
          generator: {
            filename: "asset-modules/[name][ext]",
          },
        },
      ],
    },
    ...config,
  };

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    compiler.outputFileSystem = createFsFromVolume(new Volume());
  }

  return compiler;
};
