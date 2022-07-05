const { run, runEmit } = require("./helpers/run");

describe("info option", () => {
  it('should work without "info" option', (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      patterns: [
        {
          from: "file.txt",
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it('should work when "info" option is a object', (done) => {
    run({
      expectedAssetKeys: ["file.txt"],
      patterns: [
        {
          from: "file.txt",
          info: { test: true },
        },
      ],
    })
      .then(({ compilation }) => {
        expect(compilation.assetsInfo.get("file.txt").test).toBe(true);
      })
      .then(done)
      .catch(done);
  });

  it('should work when "info" option is a object and "force" option is true', (done) => {
    const expectedAssetKeys = ["file.txt"];

    run({
      preCopy: {
        additionalAssets: [
          { name: "file.txt", data: "Content", info: { custom: true } },
        ],
      },
      expectedAssetKeys,
      patterns: [
        {
          from: "file.txt",
          force: true,
          info: { test: true },
        },
      ],
    })
      .then(({ compilation }) => {
        expect(compilation.assetsInfo.get("file.txt").test).toBe(true);
      })
      .then(done)
      .catch(done);
  });

  it('should work when "info" option is a function', (done) => {
    run({
      expectedAssetKeys: ["file.txt"],
      patterns: [
        {
          from: "file.txt",
          info: (file) => {
            expect.assertions(4);

            const fileKeys = ["absoluteFilename", "sourceFilename", "filename"];

            for (const key of fileKeys) {
              expect(key in file).toBe(true);
            }

            return { test: true };
          },
        },
      ],
    })
      .then(({ compilation }) => {
        expect(compilation.assetsInfo.get("file.txt").test).toBe(true);
      })
      .then(done)
      .catch(done);
  });

  it('should work when "info" option is a function and "force" option is true', (done) => {
    const expectedAssetKeys = ["file.txt"];

    run({
      preCopy: {
        additionalAssets: [
          { name: "file.txt", data: "Content", info: { custom: true } },
        ],
      },
      expectedAssetKeys,
      patterns: [
        {
          from: "file.txt",
          force: true,
          info: () => {
            return { test: true };
          },
        },
      ],
    })
      .then(({ compilation }) => {
        expect(compilation.assetsInfo.get("file.txt").test).toBe(true);
      })
      .then(done)
      .catch(done);
  });
});
