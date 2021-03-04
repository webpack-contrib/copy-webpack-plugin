import { run } from "./helpers/run";

describe("priority option", () => {
  it("should copy without specifying priority option", (done) => {
    run({
      expectedAssetKeys: [],
      patterns: [
        {
          from: "dir (86)/file.txt",
          to: "newfile.txt",
          force: true,
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
          force: true,
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
});
