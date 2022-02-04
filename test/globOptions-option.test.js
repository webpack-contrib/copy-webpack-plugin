import path from "path";

import { runEmit } from "./helpers/run";

const FIXTURES_DIR_NORMALIZED = path
  .join(__dirname, "fixtures")
  .replace(/\\/g, "/");

describe("globOptions option", () => {
  // Expected behavior from `globby`/`fast-glob`
  it('should copy files exclude dot files when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [".file.txt"],
      patterns: [
        {
          from: ".file.txt",
          globOptions: {
            dot: false,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should copy files exclude dot files when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [
        "directoryfile.txt",
        "nested/deep-nested/deepnested.txt",
        "nested/nestedfile.txt",
      ],
      patterns: [
        {
          from: "directory",
          globOptions: {
            dot: false,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should copy files exclude dot files when "from" is a glob', (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      patterns: [
        {
          from: "*.txt",
          globOptions: {
            dot: false,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should copy files include dot files", (done) => {
    runEmit({
      expectedAssetKeys: [".file.txt", "file.txt"],
      patterns: [
        {
          from: "*.txt",
          globOptions: {
            dot: true,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files when "from" is a file', (done) => {
    runEmit({
      expectedErrors: [
        new Error(
          `unable to locate '${FIXTURES_DIR_NORMALIZED}/file.txt' glob`
        ),
      ],
      patterns: [
        {
          from: "file.txt",
          globOptions: {
            ignore: ["**/file.*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should files when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [
        ".dottedfile",
        "directoryfile.txt",
        "nested/deep-nested/deepnested.txt",
      ],
      patterns: [
        {
          from: "directory",
          globOptions: {
            ignore: ["**/nestedfile.*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should work with globOptions.objectMode && globOptions.gitignore", (done) => {
    runEmit({
      expectedAssetKeys: [
        ".dottedfile",
        "directoryfile.txt",
        "nested/deep-nested/deepnested.txt",
      ],
      patterns: [
        {
          from: "directory",
          globOptions: {
            objectMode: true,
            gitignore: true,
            ignore: ["**/nestedfile.*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should files in nested directory when "from" is a directory', (done) => {
    runEmit({
      expectedAssetKeys: [".dottedfile", "directoryfile.txt"],
      patterns: [
        {
          from: "directory",
          globOptions: {
            ignore: ["**/nested/**"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should files when from is a glob", (done) => {
    runEmit({
      expectedAssetKeys: [
        "directory/directoryfile.txt",
        "directory/nested/deep-nested/deepnested.txt",
      ],
      patterns: [
        {
          from: "directory/**/*",
          globOptions: {
            ignore: ["**/nestedfile.*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should files in nested directory when from is a glob", (done) => {
    runEmit({
      expectedAssetKeys: ["directory/directoryfile.txt"],
      patterns: [
        {
          from: "directory/**/*",
          globOptions: {
            ignore: ["**/nested/**"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should ignore files with a certain extension", (done) => {
    runEmit({
      expectedAssetKeys: [".dottedfile"],
      patterns: [
        {
          from: "directory",
          globOptions: {
            ignore: ["**/*.txt"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should ignore files with multiple ignore patterns", (done) => {
    runEmit({
      expectedAssetKeys: ["directory/nested/nestedfile.txt"],
      patterns: [
        {
          from: "directory/**/*",
          globOptions: {
            ignore: ["**/directoryfile.*", "**/deep-nested/**"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should ignore files with flatten copy", (done) => {
    runEmit({
      expectedAssetKeys: ["img/.dottedfile", "img/nestedfile.txt"],
      patterns: [
        {
          from: "directory/",
          toType: "file",
          to({ absoluteFilename }) {
            return `img/${path.basename(absoluteFilename)}`;
          },
          globOptions: {
            ignore: ["**/directoryfile.*", "**/deep-nested/**"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  // Regression in `globby`
  it.skip("should ignore files except those with dots", (done) => {
    runEmit({
      expectedAssetKeys: [".dottedfile"],
      patterns: [
        {
          from: "directory",
          globOptions: {
            ignore: ["!(**/.*)"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should ignore files that start with a dot", (done) => {
    runEmit({
      expectedAssetKeys: [
        "directoryfile.txt",
        "nested/deep-nested/deepnested.txt",
        "nested/nestedfile.txt",
      ],
      patterns: [
        {
          from: "directory",
          globOptions: {
            ignore: ["**/.*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should ignores all files even if they start with a dot", (done) => {
    runEmit({
      expectedErrors: [
        new Error(
          `unable to locate '${FIXTURES_DIR_NORMALIZED}/directory/**/*' glob`
        ),
      ],
      patterns: [
        {
          from: "directory",
          globOptions: {
            ignore: ["**/*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore files when "from" is a file (global ignore)', (done) => {
    runEmit({
      expectedErrors: [
        new Error(
          `unable to locate '${FIXTURES_DIR_NORMALIZED}/file.txt' glob`
        ),
      ],
      patterns: [
        {
          from: "file.txt",
          globOptions: {
            ignore: ["**/file.*"],
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should ignore the "cwd" option', (done) => {
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
          globOptions: {
            cwd: path.resolve(__dirname, "fixtures/nested"),
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work with the "deep" option', (done) => {
    runEmit({
      expectedAssetKeys: [
        ".dottedfile",
        "directoryfile.txt",
        "nested/nestedfile.txt",
      ],
      patterns: [
        {
          from: "directory",
          globOptions: {
            deep: 2,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work with the "markDirectories" option', (done) => {
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
          globOptions: {
            markDirectories: true,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work with the "objectMode" option', (done) => {
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
          globOptions: {
            objectMode: true,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work with the "onlyDirectories" option', (done) => {
    runEmit({
      expectedAssetKeys: [],
      patterns: [
        {
          noErrorOnMissing: true,
          from: "directory",
          globOptions: {
            onlyDirectories: true,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should emit error when not found assets for copy", (done) => {
    expect.assertions(1);

    runEmit({
      expectedAssetKeys: [],
      patterns: [
        {
          from: "directory",
          globOptions: {
            onlyDirectories: true,
          },
        },
      ],
    })
      .then(done)
      .catch((error) => {
        expect(error).toBeDefined();

        done();
      });
  });

  it('should work with the "onlyFiles" option', (done) => {
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
          globOptions: {
            onlyFiles: true,
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
