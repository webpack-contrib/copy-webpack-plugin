import path from "path";

import { runEmit } from "./helpers/run";

const BUILD_DIR = path.join(__dirname, "build");
const TEMP_DIR = path.join(__dirname, "tempdir");
const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("to option", () => {
  describe("is a file", () => {
    it("should move a file to a new file", (done) => {
      runEmit({
        expectedAssetKeys: ["newfile.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "newfile.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new file when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ["../tempdir/newfile.txt"],
        patterns: [
          {
            from: "file.txt",
            to: path.join(TEMP_DIR, "newfile.txt"),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file to a new file inside nested directory", (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/newfile.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "newdirectory/newfile.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new file inside nested directory when "to" an absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/newfile.txt"],
        patterns: [
          {
            from: "file.txt",
            to: path.join(BUILD_DIR, "newdirectory/newfile.txt"),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file to a new file inside other directory what out of context", (done) => {
      runEmit({
        expectedAssetKeys: ["../tempdir/newdirectory/newfile.txt"],
        patterns: [
          {
            from: "file.txt",
            to: path.join(TEMP_DIR, "newdirectory/newfile.txt"),
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file using invalid template syntax", (done) => {
      runEmit({
        expectedAssetKeys: ["directory/[md5::base64:20].txt"],
        patterns: [
          {
            from: "directory/directoryfile.txt",
            to: "directory/[md5::base64:20].txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe("is a directory", () => {
    it("should move a file to a new directory", (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "newdirectory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file to a new directory out of context", (done) => {
      runEmit({
        expectedAssetKeys: ["../tempdir/file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: TEMP_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file to a new directory with a forward slash", (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "newdirectory/",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file to a new directory with an extension and path separator at end", (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory.ext/file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: `newdirectory.ext${path.sep}`,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ["file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory when "to" is absolute path with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: ["file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: `${BUILD_DIR}/`,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file to a new directory from nested directory", (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/directoryfile.txt"],
        patterns: [
          {
            from: "directory/directoryfile.txt",
            to: "newdirectory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory from nested directory when "from" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/directoryfile.txt"],
        patterns: [
          {
            from: path.join(FIXTURES_DIR, "directory", "directoryfile.txt"),
            to: "newdirectory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory from nested directory when "from" is absolute path with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/directoryfile.txt"],
        patterns: [
          {
            from: path.join(FIXTURES_DIR, "directory", "directoryfile.txt"),
            to: "newdirectory/",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files to a new directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          "newdirectory/.dottedfile",
          "newdirectory/directoryfile.txt",
          "newdirectory/nested/deep-nested/deepnested.txt",
          "newdirectory/nested/nestedfile.txt",
        ],
        patterns: [
          {
            from: "directory",
            to: "newdirectory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files to a new nested directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          "newdirectory/deep-nested/deepnested.txt",
          "newdirectory/nestedfile.txt",
        ],
        patterns: [
          {
            from: path.join(FIXTURES_DIR, "directory", "nested"),
            to: "newdirectory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files to a new directory out of context", (done) => {
      runEmit({
        expectedAssetKeys: [
          "../tempdir/.dottedfile",
          "../tempdir/directoryfile.txt",
          "../tempdir/nested/deep-nested/deepnested.txt",
          "../tempdir/nested/nestedfile.txt",
        ],
        patterns: [
          {
            from: "directory",
            to: TEMP_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files to a new directory when "to" is absolute path', (done) => {
      runEmit({
        expectedAssetKeys: [
          ".dottedfile",
          "directoryfile.txt",
          "nested/deep-nested/deepnested.txt",
          "nested/nestedfile.txt",
        ],
        patterns: [
          {
            from: "directory",
            to: BUILD_DIR,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files to a new directory when "to" is absolute path with a forward slash', (done) => {
      runEmit({
        expectedAssetKeys: [
          ".dottedfile",
          "directoryfile.txt",
          "nested/deep-nested/deepnested.txt",
          "nested/nestedfile.txt",
        ],
        patterns: [
          {
            from: "directory",
            to: `${BUILD_DIR}/`,
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files to a new directory from nested directory", (done) => {
      runEmit({
        expectedAssetKeys: [
          "newdirectory/deep-nested/deepnested.txt",
          "newdirectory/nestedfile.txt",
        ],
        patterns: [
          {
            from: "directory/nested",
            to: "newdirectory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to a new directory when "to" is empty', (done) => {
      runEmit({
        expectedAssetKeys: ["file.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "",
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe("is a template", () => {
    it('should move a file using "contenthash"', (done) => {
      runEmit({
        expectedAssetKeys: ["directory/5d7817.txt"],
        patterns: [
          {
            from: "directory/directoryfile.txt",
            to: "directory/[contenthash:6].txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file using custom `contenthash` digest", (done) => {
      runEmit({
        expectedAssetKeys: ["directory/c2a6.txt"],
        patterns: [
          {
            from: "directory/directoryfile.txt",
            to: "directory/[sha1:contenthash:hex:4].txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file using "name" and "ext"', (done) => {
      runEmit({
        expectedAssetKeys: ["binextension.bin"],
        patterns: [
          {
            from: "binextension.bin",
            to: "[name].[ext]",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file using "name", "contenthash" and "ext"', (done) => {
      runEmit({
        expectedAssetKeys: ["file-5d7817.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "[name]-[contenthash:6].[ext]",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file from nested directory", (done) => {
      runEmit({
        expectedAssetKeys: ["directoryfile-5d7817.txt"],
        patterns: [
          {
            from: "directory/directoryfile.txt",
            to: "[name]-[hash:6].[ext]",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move a file from nested directory to new directory", (done) => {
      runEmit({
        expectedAssetKeys: ["newdirectory/directoryfile-5d7817.txt"],
        patterns: [
          {
            from: "directory/directoryfile.txt",
            to: "newdirectory/[name]-[hash:6].[ext]",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file without an extension using "name", "ext"', (done) => {
      runEmit({
        expectedAssetKeys: ["noextension.31d6cf.newext"],
        patterns: [
          {
            from: "noextension",
            to: "[name][ext].[contenthash:6].newext",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move files using "path", "name", "contenthash" and "ext"', (done) => {
      runEmit({
        expectedAssetKeys: [
          "newdirectory/.dottedfile-5e294e",
          "newdirectory/directoryfile-5d7817.txt",
          "newdirectory/nested/deep-nested/deepnested-31d6cf.txt",
          "newdirectory/nested/nestedfile-31d6cf.txt",
        ],
        patterns: [
          {
            from: "directory",
            to: "newdirectory/[path][name]-[contenthash:6].[ext]",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should move a file to "compiler.options.output" by default', (done) => {
      runEmit({
        compilation: { output: { path: "/path/to" } },
        expectedAssetKeys: ["newfile.txt"],
        patterns: [
          {
            from: "file.txt",
            to: "newfile.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe("to option as function", () => {
    it('should transform target path when "from" is a file', (done) => {
      runEmit({
        expectedAssetKeys: ["subdir/test.txt"],
        patterns: [
          {
            from: "file.txt",
            to({ context, absoluteFilename }) {
              expect(absoluteFilename).toBe(
                path.join(FIXTURES_DIR, "file.txt")
              );

              const targetPath = path.relative(context, absoluteFilename);

              return targetPath.replace("file.txt", "subdir/test.txt");
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should transform target path of every when "from" is a directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          "../.dottedfile",
          "../deepnested.txt",
          "../directoryfile.txt",
          "../nestedfile.txt",
        ],
        patterns: [
          {
            from: "directory",
            toType: "file",
            to({ context, absoluteFilename }) {
              expect(
                absoluteFilename.includes(path.join(FIXTURES_DIR, "directory"))
              ).toBe(true);

              const targetPath = path.relative(context, absoluteFilename);

              return path.resolve(__dirname, path.basename(targetPath));
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should transform target path of every file when "from" is a glob', (done) => {
      runEmit({
        expectedAssetKeys: [
          "../deepnested.txt.tst",
          "../directoryfile.txt.tst",
          "../nestedfile.txt.tst",
        ],
        patterns: [
          {
            from: "directory/**/*",
            to({ context, absoluteFilename }) {
              expect(absoluteFilename.includes(FIXTURES_DIR)).toBe(true);

              const targetPath = path.relative(context, absoluteFilename);

              return path.resolve(
                __dirname,
                `${path.basename(targetPath)}.tst`
              );
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should transform target path when function return Promise", (done) => {
      runEmit({
        expectedAssetKeys: ["../file.txt"],
        patterns: [
          {
            from: "file.txt",
            to({ context, absoluteFilename }) {
              expect(absoluteFilename.includes(FIXTURES_DIR)).toBe(true);

              const targetPath = path.relative(context, absoluteFilename);

              return new Promise((resolve) => {
                resolve(path.resolve(__dirname, path.basename(targetPath)));
              });
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should transform target path when async function used", (done) => {
      runEmit({
        expectedAssetKeys: ["../file.txt"],
        patterns: [
          {
            from: "file.txt",
            async to({ context, absoluteFilename }) {
              expect(absoluteFilename.includes(FIXTURES_DIR)).toBe(true);

              const targetPath = path.relative(context, absoluteFilename);

              const newPath = await new Promise((resolve) => {
                resolve(path.resolve(__dirname, path.basename(targetPath)));
              });

              return newPath;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should warn when function throw error", (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: [new Error("a failure happened")],
        patterns: [
          {
            from: "file.txt",
            to() {
              throw new Error("a failure happened");
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should warn when Promise was rejected", (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: [new Error("a failure happened")],
        patterns: [
          {
            from: "file.txt",
            to() {
              return new Promise((resolve, reject) => {
                return reject(new Error("a failure happened"));
              });
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should warn when async function throw error", (done) => {
      runEmit({
        expectedAssetKeys: [],
        expectedErrors: [new Error("a failure happened")],
        patterns: [
          {
            from: "file.txt",
            async to() {
              await new Promise((resolve, reject) => {
                reject(new Error("a failure happened"));
              });
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should transform target path of every file in glob after applying template", (done) => {
      runEmit({
        expectedAssetKeys: [
          "transformed/directory/directoryfile-5d7817.txt",
          "transformed/directory/nested/deep-nested/deepnested-31d6cf.txt",
          "transformed/directory/nested/nestedfile-31d6cf.txt",
        ],
        patterns: [
          {
            from: "directory/**/*",
            to({ absoluteFilename }) {
              expect(absoluteFilename.includes(FIXTURES_DIR)).toBe(true);

              return "transformed/[path][name]-[hash:6].[ext]";
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files", (done) => {
      runEmit({
        expectedAssetKeys: ["txt"],
        patterns: [
          {
            from: "directory/nested/deep-nested",
            toType: "file",
            to({ absoluteFilename }) {
              const mathes = absoluteFilename.match(/\.([^.]*)$/);
              const [, res] = mathes;
              const target = res;

              return target;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files to a non-root directory", (done) => {
      runEmit({
        expectedAssetKeys: ["nested/txt"],
        patterns: [
          {
            from: "directory/nested/deep-nested",
            toType: "file",
            to({ absoluteFilename }) {
              const mathes = absoluteFilename.match(/\.([^.]*)$/);
              const [, res] = mathes;
              const target = `nested/${res}`;

              return target;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it("should move files", (done) => {
      runEmit({
        expectedAssetKeys: [
          "deep-nested-deepnested.txt",
          "directoryfile.txt",
          "nested-nestedfile.txt",
        ],
        patterns: [
          {
            from: "**/*",
            context: "directory",
            to({ context, absoluteFilename }) {
              const targetPath = path.relative(context, absoluteFilename);
              const pathSegments = path.parse(targetPath);
              const result = [];

              if (pathSegments.root) {
                result.push(pathSegments.root);
              }

              if (pathSegments.dir) {
                result.push(pathSegments.dir.split(path.sep).pop());
              }

              if (pathSegments.base) {
                result.push(pathSegments.base);
              }

              return result.join("-");
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe("settings for to option for flatten copy", () => {
    it('should flatten a directory\'s files to a root directory when "from" is a file', (done) => {
      runEmit({
        expectedAssetKeys: ["directoryfile.txt"],
        patterns: [
          {
            to: ".",
            from: "directory/directoryfile.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten a directory\'s files to a new directory when "from" is a file', (done) => {
      runEmit({
        expectedAssetKeys: ["nested/directoryfile.txt"],
        patterns: [
          {
            to({ absoluteFilename }) {
              return `nested/${path.basename(absoluteFilename)}`;
            },
            from: "directory/directoryfile.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten a directory\'s files to a root directory when "from" is a directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          ".dottedfile",
          "deepnested.txt",
          "directoryfile.txt",
          "nestedfile.txt",
        ],
        patterns: [
          {
            to: "[name].[ext]",
            from: "directory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten a directory\'s files to new directory when "from" is a directory', (done) => {
      runEmit({
        expectedAssetKeys: [
          "newdirectory/.dottedfile",
          "newdirectory/deepnested.txt",
          "newdirectory/directoryfile.txt",
          "newdirectory/nestedfile.txt",
        ],
        patterns: [
          {
            toType: "file",
            to({ absoluteFilename }) {
              return `newdirectory/${path.basename(absoluteFilename)}`;
            },
            from: "directory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten a directory\'s files to a root directory when "from" is a glob', (done) => {
      runEmit({
        expectedAssetKeys: [
          "deepnested.txt",
          "directoryfile.txt",
          "nestedfile.txt",
        ],
        patterns: [
          {
            to({ absoluteFilename }) {
              return path.basename(absoluteFilename);
            },
            from: "directory/**/*",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten a directory\'s files to a new directory when "from" is a glob', (done) => {
      runEmit({
        expectedAssetKeys: [
          "nested/deepnested.txt",
          "nested/directoryfile.txt",
          "nested/nestedfile.txt",
        ],
        patterns: [
          {
            to({ absoluteFilename }) {
              return `nested/${path.basename(absoluteFilename)}`;
            },
            from: "directory/**/*",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten files in a relative context to a root directory when "from" is a glob', (done) => {
      runEmit({
        expectedAssetKeys: [
          "deepnested.txt",
          "directoryfile.txt",
          "nestedfile.txt",
        ],
        patterns: [
          {
            context: "directory",
            from: "**/*",
            to({ absoluteFilename }) {
              return path.basename(absoluteFilename);
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should flatten files in a relative context to a non-root directory when "from" is a glob', (done) => {
      runEmit({
        expectedAssetKeys: [
          "nested/deepnested.txt",
          "nested/directoryfile.txt",
          "nested/nestedfile.txt",
        ],
        patterns: [
          {
            context: "directory",
            from: "**/*",
            to({ absoluteFilename }) {
              return `nested/${path.basename(absoluteFilename)}`;
            },
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });
});
