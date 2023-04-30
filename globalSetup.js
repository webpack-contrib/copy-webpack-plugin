const path = require("path");
const fs = require("fs");

const webpack = require("webpack");

const removeIllegalCharacterForWindows = require("./test/helpers/removeIllegalCharacterForWindows");

const baseDir = path.resolve(__dirname, "test/fixtures");

const specialFiles = {
  "[special$directory]/nested/nestedfile.txt": "",
  "[special$directory]/(special-*file).txt": "special",
  "[special$directory]/directoryfile.txt": "new",
};

module.exports = () => {
  Object.keys(specialFiles).forEach((originFile) => {
    const file = removeIllegalCharacterForWindows(originFile);
    const dir = path.dirname(file);

    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
    fs.writeFileSync(path.join(baseDir, file), specialFiles[originFile]);
  });

  return Promise.resolve()
    .then(() => {
      const compiler = webpack({
        devtool: false,
        mode: "development",
        target: "node",
        entry: path.resolve(__dirname, "node_modules/globby/index.js"),
        output: {
          path: path.resolve(__dirname, "test/bundled/globby"),
          filename: "index.js",
          library: {
            type: "commonjs2",
          },
        },
      });

      return new Promise((resolve, reject) => {
        compiler.run((error, stats) => {
          if (error) {
            reject(error);

            return;
          }

          // eslint-disable-next-line no-console
          console.log(stats.toString());

          compiler.close(() => {
            resolve();
          });
        });
      });
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
      process.exit(1);
    });
};
