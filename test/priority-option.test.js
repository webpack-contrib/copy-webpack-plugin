import { run } from "./helpers/run";

describe("priority option", () => {
  it("should copy without specifying priority option", (done) => {
    run({
      expectedAssetKeys: [],
      patterns: [
        {
          from: "dir (86)/file.txt",
          to: "newfile.txt",
        },
        {
          from: "file.txt",
          to: "newfile.txt",
          force: true,
        },
      ],
    })
      .then(({ stats }) => {
        const { info } = stats.compilation.getAsset("newfile.txt");

        expect(info.sourceFilename).toEqual("file.txt");

        done();
      })
      .catch(done);
  });

  it("should copy with specifying priority option", (done) => {
    run({
      expectedAssetKeys: [],
      patterns: [
        {
          from: "dir (86)/file.txt",
          to: "newfile.txt",
          force: true,
          priority: 10,
        },
        {
          from: "file.txt",
          to: "newfile.txt",
          priority: 5,
        },
      ],
    })
      .then(({ stats }) => {
        const { info } = stats.compilation.getAsset("newfile.txt");

        expect(info.sourceFilename).toEqual("dir (86)/file.txt");

        done();
      })
      .catch(done);
  });

  it("should copy with specifying priority option and respect negative priority", (done) => {
    run({
      expectedAssetKeys: [],
      patterns: [
        {
          from: "dir (86)/file.txt",
          to: "newfile.txt",
          priority: 10,
          force: true,
        },
        {
          from: "file.txt",
          to: "other-newfile.txt",
        },
        {
          from: "file.txt",
          to: "newfile.txt",
          priority: -5,
        },
      ],
    })
      .then(({ stats }) => {
        const { info } = stats.compilation.getAsset("newfile.txt");

        expect(info.sourceFilename).toEqual("dir (86)/file.txt");

        done();
      })
      .catch(done);
  });

  it("should copy with specifying priority option and respect order of patterns", (done) => {
    run({
      expectedAssetKeys: [],
      patterns: [
        {
          from: "dir (86)/file.txt",
          to: "newfile.txt",
          priority: 10,
        },
        {
          from: "file.txt",
          to: "newfile.txt",
          priority: 10,
          force: true,
        },
      ],
    })
      .then(({ stats }) => {
        const { info } = stats.compilation.getAsset("newfile.txt");

        expect(info.sourceFilename).toEqual("file.txt");

        done();
      })
      .catch(done);
  });
});
