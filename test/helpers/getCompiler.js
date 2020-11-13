import path from "path";

import webpack from "webpack";
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
        webpack.version[0] === "5"
          ? {
              test: /\.txt/,
              type: "asset/resource",
              generator: {
                filename: "asset-modules/[name][ext]",
              },
            }
          : {
              test: /\.txt/,
              loader: "file-loader",
              options: {
                name: "asset-modules/[name].[ext]",
              },
            },
      ],
    },
    ...config,
  };

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    const outputFileSystem = createFsFromVolume(new Volume());
    // Todo remove when we drop webpack@4 support
    outputFileSystem.join = path.join.bind(path);

    compiler.outputFileSystem = outputFileSystem;
  }

  return compiler;
};
