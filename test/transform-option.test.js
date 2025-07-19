import path from "node:path";
import zlib from "node:zlib";

import { run, runEmit } from "./helpers/run";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("transform option", () => {
  it('should transform file when "from" is a file', (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt": "newchanged",
      },
      patterns: [
        {
          from: "file.txt",
          transform: {
            transformer(content, absoluteFrom) {
              expect(absoluteFrom).toContain(FIXTURES_DIR);

              return `${content}changed`;
            },
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
        ".dottedfile",
        "directoryfile.txt",
        "nested/deep-nested/deepnested.txt",
        "nested/nestedfile.txt",
      ],
      expectedAssetContent: {
        ".dottedfile": "dottedfile contents\nchanged",
        "directoryfile.txt": "newchanged",
        "nested/deep-nested/deepnested.txt": "changed",
        "nested/nestedfile.txt": "changed",
      },
      patterns: [
        {
          from: "directory",
          transform: {
            transformer(content, absoluteFrom) {
              expect(absoluteFrom).toContain(FIXTURES_DIR);

              return `${content}changed`;
            },
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
        "directory/directoryfile.txt",
        "directory/nested/deep-nested/deepnested.txt",
        "directory/nested/nestedfile.txt",
      ],
      expectedAssetContent: {
        "directory/directoryfile.txt": "newchanged",
        "directory/nested/deep-nested/deepnested.txt": "changed",
        "directory/nested/nestedfile.txt": "changed",
      },
      patterns: [
        {
          from: "directory/**/*",
          transform: {
            transformer(content, absoluteFrom) {
              expect(absoluteFrom).toContain(FIXTURES_DIR);

              return `${content}changed`;
            },
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform file when transform is function", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt": "newchanged!",
      },
      patterns: [
        {
          from: "file.txt",
          transform: (content) => `${content}changed!`,
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform file when function return Promise", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt": "newchanged!",
      },
      patterns: [
        {
          from: "file.txt",
          transform(content) {
            return new Promise((resolve) => {
              resolve(`${content}changed!`);
            });
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform file when function `transformer` return Promise", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt": "newchanged!",
      },
      patterns: [
        {
          from: "file.txt",
          transform: {
            transformer(content) {
              return new Promise((resolve) => {
                resolve(`${content}changed!`);
              });
            },
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform target path when async function used", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt": "newchanged!",
      },
      patterns: [
        {
          from: "file.txt",
          transform: {
            async transformer(content) {
              const newPath = await new Promise((resolve) => {
                resolve(`${content}changed!`);
              });

              return newPath;
            },
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
          transform: {
            transformer() {
              throw new Error("a failure happened");
            },
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
          transform: {
            transformer() {
              return new Promise((resolve, reject) => {
                reject(new Error("a failure happened"));
              });
            },
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
          transform: {
            async transformer() {
              await new Promise((resolve, reject) => {
                reject(new Error("a failure happened"));
              });
            },
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should be a different size for the source file and the converted file", (done) => {
    run({
      patterns: [
        {
          from: "file.txt",
        },
        {
          from: "file.txt",
          to: "file.txt.gz",
          transform: {
            transformer: (content) => zlib.gzipSync(content),
          },
        },
      ],
    })
      .then(({ compilation }) => {
        expect(compilation.assets["file.txt"].size()).not.toBe(
          compilation.assets["file.txt.gz"].size(),
        );
      })
      .then(done)
      .catch(done);
  });

  it('should transform file when "from" is a file and it contains specific content', (done) => {
    runEmit({
      expectedAssetKeys: ["subdir/test.txt"],
      expectedAssetContent: {
        "subdir/test.txt": "newchanged",
      },
      patterns: [
        {
          from: "file.txt",
          transform: {
            transformer(content, absoluteFrom) {
              expect(absoluteFrom).toContain(FIXTURES_DIR);

              return `${content}changed`;
            },
          },
          to({ context, absoluteFilename }) {
            expect(absoluteFilename).toBe(path.join(FIXTURES_DIR, "file.txt"));

            const targetPath = path.relative(context, absoluteFilename);

            return targetPath.replace("file.txt", "subdir/test.txt");
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
