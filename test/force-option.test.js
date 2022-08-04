const { runForce } = require("./helpers/run");

describe("force option", () => {
  describe("is not specified", () => {
    it('should not overwrite a file already in the compilation by default when "from" is a file', (done) => {
      runForce({
        additionalAssets: [{ name: "file.txt", data: "existing" }],
        expectedAssetKeys: ["file.txt"],
        expectedAssetContent: {
          "file.txt": "existing",
        },
        patterns: [
          {
            from: "file.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should not overwrite files already in the compilation when "from" is a directory', (done) => {
      runForce({
        additionalAssets: [
          { name: ".dottedfile", data: "existing" },
          { name: "directoryfile.txt", data: "existing" },
          { name: "nested/deep-nested/deepnested.txt", data: "existing" },
          { name: "nested/nestedfile.txt", data: "existing" },
        ],
        expectedAssetKeys: [
          ".dottedfile",
          "directoryfile.txt",
          "nested/deep-nested/deepnested.txt",
          "nested/nestedfile.txt",
        ],
        expectedAssetContent: {
          ".dottedfile": "existing",
          "nested/deep-nested/deepnested.txt": "existing",
          "nested/nestedfile.txt": "existing",
          "directoryfile.txt": "existing",
        },
        patterns: [
          {
            from: "directory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should not overwrite files already in the compilation when "from" is a glob', (done) => {
      runForce({
        additionalAssets: [
          { name: "directory/directoryfile.txt", data: "existing" },
          {
            name: "directory/nested/deep-nested/deepnested.txt",
            data: "existing",
          },
          { name: "directory/nested/nestedfile.txt", data: "existing" },
        ],
        expectedAssetKeys: [
          "directory/directoryfile.txt",
          "directory/nested/deep-nested/deepnested.txt",
          "directory/nested/nestedfile.txt",
        ],
        expectedAssetContent: {
          "directory/nested/deep-nested/deepnested.txt": "existing",
          "directory/nested/nestedfile.txt": "existing",
          "directory/directoryfile.txt": "existing",
        },
        patterns: [
          {
            from: "directory/**/*",
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('is "false" (Boolean)', () => {
    it('should not overwrite a file already in the compilation by default when "from" is a file', (done) => {
      runForce({
        additionalAssets: [{ name: "file.txt", data: "existing" }],
        expectedAssetKeys: ["file.txt"],
        expectedAssetContent: {
          "file.txt": "existing",
        },
        patterns: [
          {
            force: false,
            from: "file.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should not overwrite files already in the compilation when "from" is a directory', (done) => {
      runForce({
        additionalAssets: [
          { name: ".dottedfile", data: "existing" },
          { name: "directoryfile.txt", data: "existing" },
          { name: "nested/deep-nested/deepnested.txt", data: "existing" },
          { name: "nested/nestedfile.txt", data: "existing" },
        ],
        expectedAssetKeys: [
          ".dottedfile",
          "directoryfile.txt",
          "nested/deep-nested/deepnested.txt",
          "nested/nestedfile.txt",
        ],
        expectedAssetContent: {
          ".dottedfile": "existing",
          "nested/deep-nested/deepnested.txt": "existing",
          "nested/nestedfile.txt": "existing",
          "directoryfile.txt": "existing",
        },
        patterns: [
          {
            force: false,
            from: "directory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should not overwrite files already in the compilation when "from" is a glob', (done) => {
      runForce({
        additionalAssets: [
          { name: "directory/directoryfile.txt", data: "existing" },
          {
            name: "directory/nested/deep-nested/deepnested.txt",
            data: "existing",
          },
          { name: "directory/nested/nestedfile.txt", data: "existing" },
        ],
        expectedAssetKeys: [
          "directory/directoryfile.txt",
          "directory/nested/deep-nested/deepnested.txt",
          "directory/nested/nestedfile.txt",
        ],
        expectedAssetContent: {
          "directory/nested/deep-nested/deepnested.txt": "existing",
          "directory/nested/nestedfile.txt": "existing",
          "directory/directoryfile.txt": "existing",
        },
        patterns: [
          {
            force: false,
            from: "directory/**/*",
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe('is "true" (Boolean)', () => {
    it('should force overwrite a file already in the compilation when "from" is a file', (done) => {
      runForce({
        additionalAssets: [{ name: "file.txt", data: "existing" }],
        expectedAssetKeys: ["file.txt"],
        expectedAssetContent: {
          "file.txt": "new",
        },
        patterns: [
          {
            force: true,
            from: "file.txt",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should force overwrite files already in the compilation when "from" is a directory', (done) => {
      runForce({
        additionalAssets: [
          { name: ".dottedfile", data: "existing" },
          { name: "directoryfile.txt", data: "existing" },
          { name: "nested/deep-nested/deepnested.txt", data: "existing" },
          { name: "nested/nestedfile.txt", data: "existing" },
        ],
        expectedAssetKeys: [
          ".dottedfile",
          "directoryfile.txt",
          "nested/deep-nested/deepnested.txt",
          "nested/nestedfile.txt",
        ],
        expectedAssetContent: {
          ".dottedfile": "dottedfile contents\n",
          "nested/deep-nested/deepnested.txt": "",
          "nested/nestedfile.txt": "",
          "directoryfile.txt": "new",
        },
        patterns: [
          {
            force: true,
            from: "directory",
          },
        ],
      })
        .then(done)
        .catch(done);
    });

    it('should force overwrite files already in the compilation when "from" is a glob', (done) => {
      runForce({
        additionalAssets: [
          { name: "directory/directoryfile.txt", data: "existing" },
          {
            name: "directory/nested/deep-nested/deepnested.txt",
            data: "existing",
          },
          { name: "directory/nested/nestedfile.txt", data: "existing" },
        ],
        expectedAssetKeys: [
          "directory/directoryfile.txt",
          "directory/nested/deep-nested/deepnested.txt",
          "directory/nested/nestedfile.txt",
        ],
        expectedAssetContent: {
          "directory/nested/deep-nested/deepnested.txt": "",
          "directory/nested/nestedfile.txt": "",
          "directory/directoryfile.txt": "new",
        },
        patterns: [
          {
            force: true,
            from: "directory/**/*",
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });
});
