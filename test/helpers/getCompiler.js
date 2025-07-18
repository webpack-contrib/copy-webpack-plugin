import path from "node:path";

import { Volume, createFsFromVolume } from "memfs";
import webpack from "webpack";

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
