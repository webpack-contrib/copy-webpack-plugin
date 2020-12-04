import path from "path";

import { runEmit } from "./helpers/run";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("transformPath option", () => {
  it('should transform target path when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ["subdir/test.txt"],
      patterns: [
        {
          from: "file.txt",
          to(context, absoluteFrom) {
            expect(absoluteFrom).toBe(path.join(FIXTURES_DIR, "file.txt"));

            const targetPath = path.relative(context, absoluteFrom);

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
        "/some/path/.dottedfile",
        "/some/path/deepnested.txt",
        "/some/path/directoryfile.txt",
        "/some/path/nestedfile.txt",
      ],
      patterns: [
        {
          from: "directory",
          to(context, absoluteFrom) {
            expect(
              absoluteFrom.includes(path.join(FIXTURES_DIR, "directory"))
            ).toBe(true);

            const targetPath = path.relative(context, absoluteFrom);

            return `/some/path/${path.basename(targetPath)}`;
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
        "/some/path/deepnested.txt.tst",
        "/some/path/directoryfile.txt.tst",
        "/some/path/nestedfile.txt.tst",
      ],
      patterns: [
        {
          from: "directory/**/*",
          to(context, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            const targetPath = path.relative(context, absoluteFrom);

            return `/some/path/${path.basename(targetPath)}.tst`;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform target path when function return Promise", (done) => {
    runEmit({
      expectedAssetKeys: ["/some/path/file.txt"],
      patterns: [
        {
          from: "file.txt",
          to(context, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            const targetPath = path.relative(context, absoluteFrom);

            return new Promise((resolve) => {
              resolve(`/some/path/${path.basename(targetPath)}`);
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
      expectedAssetKeys: ["/some/path/file.txt"],
      patterns: [
        {
          from: "file.txt",
          async to(context, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

            const targetPath = path.relative(context, absoluteFrom);

            const newPath = await new Promise((resolve) => {
              resolve(`/some/path/${path.basename(targetPath)}`);
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
          to(context, absoluteFrom) {
            expect(absoluteFrom.includes(FIXTURES_DIR)).toBe(true);

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
          to(context, absolutePath) {
            const mathes = absolutePath.match(/\.([^.]*)$/);
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

  it("should move files to a non-root directory with [1]", (done) => {
    runEmit({
      expectedAssetKeys: ["nested/txt"],
      patterns: [
        {
          from: "directory/nested/deep-nested",
          to(context, absolutePath) {
            const mathes = absolutePath.match(/\.([^.]*)$/);
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
          to(context, absolutePath) {
            const targetPath = path.relative(context, absolutePath);
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
