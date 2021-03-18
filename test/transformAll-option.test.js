import CopyPlugin from "../src";

import { runEmit } from "./helpers/run";
import { compile, getCompiler, readAssets } from "./helpers";

describe("transformAll option", () => {
  it('should be defined "assets"', (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      patterns: [
        {
          from: "file.txt",
          transformAll(assets) {
            expect(assets).toBeDefined();

            return "";
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform files", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt":
          "new::directory/nested/deep-nested/deepnested.txt::directory/nested/nestedfile.txt::",
      },
      patterns: [
        {
          from: "directory/**/*.txt",
          to: "file.txt",
          transformAll(assets) {
            const result = assets.reduce((accumulator, asset) => {
              const content =
                asset.source.source().toString() || asset.sourceFilename;
              // eslint-disable-next-line no-param-reassign
              accumulator = `${accumulator}${content}::`;
              return accumulator;
            }, "");

            return result;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform files when async function used", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt":
          "directory/directoryfile.txt::directory/nested/deep-nested/deepnested.txt::directory/nested/nestedfile.txt::",
      },
      patterns: [
        {
          from: "directory/**/*.txt",
          to: "file.txt",
          async transformAll(assets) {
            const result = assets.reduce((accumulator, asset) => {
              // eslint-disable-next-line no-param-reassign
              accumulator = `${accumulator}${asset.sourceFilename}::`;
              return accumulator;
            }, "");

            return result;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should transform files with force option enabled", (done) => {
    runEmit({
      expectedAssetKeys: ["file.txt"],
      expectedAssetContent: {
        "file.txt":
          "directory/directoryfile.txt::directory/nested/deep-nested/deepnested.txt::directory/nested/nestedfile.txt::",
      },
      patterns: [
        {
          from: "file.txt",
        },
        {
          from: "directory/**/*.txt",
          to: "file.txt",
          transformAll(assets) {
            const result = assets.reduce((accumulator, asset) => {
              // eslint-disable-next-line no-param-reassign
              accumulator = `${accumulator}${asset.sourceFilename}::`;
              return accumulator;
            }, "");

            return result;
          },
          force: true,
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
          from: "directory/**/*.txt",
          to: "file.txt",
          transformAll() {
            // eslint-disable-next-line no-throw-literal
            throw new Error("a failure happened");
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should interpolate [fullhash] and [contenthash]", (done) => {
    runEmit({
      expectedAssetKeys: ["4333a40fa67dfaaaefc9-ac7f6fcb65ddfcc43b2c-file.txt"],
      expectedAssetContent: {
        "4333a40fa67dfaaaefc9-ac7f6fcb65ddfcc43b2c-file.txt":
          "::special::new::::::::::new::::::new::",
      },
      patterns: [
        {
          from: "**/*.txt",
          to: "[contenthash]-[fullhash]-file.txt",
          transformAll(assets) {
            const result = assets.reduce((accumulator, asset) => {
              // eslint-disable-next-line no-param-reassign
              accumulator = `${accumulator}${asset.source.source()}::`;
              return accumulator;
            }, "");

            return result;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});

describe("cache", () => {
  it('should work with the "memory" cache', async () => {
    const compiler = getCompiler({});

    new CopyPlugin({
      patterns: [
        {
          from: "directory/**/*.txt",
          to: "file.txt",
          transformAll(assets) {
            const result = assets.reduce((accumulator, asset) => {
              const content =
                asset.source.source().toString() || asset.sourceFilename;
              // eslint-disable-next-line no-param-reassign
              accumulator = `${accumulator}${content}::`;
              return accumulator;
            }, "");

            return result;
          },
        },
      ],
    }).apply(compiler);

    const { stats } = await compile(compiler);

    expect(stats.compilation.emittedAssets.size).toBe(2);
    expect(readAssets(compiler, stats)).toMatchSnapshot("assets");
    expect(stats.compilation.errors).toMatchSnapshot("errors");
    expect(stats.compilation.warnings).toMatchSnapshot("warnings");

    await new Promise(async (resolve) => {
      const { stats: newStats } = await compile(compiler);

      expect(newStats.compilation.emittedAssets.size).toBe(0);
      expect(readAssets(compiler, newStats)).toMatchSnapshot("assets");
      expect(newStats.compilation.errors).toMatchSnapshot("errors");
      expect(newStats.compilation.warnings).toMatchSnapshot("warnings");

      resolve();
    });
  });
});
