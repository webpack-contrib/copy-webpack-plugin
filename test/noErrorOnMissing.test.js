const { runEmit } = require("./helpers/run");

describe("noErrorOnMissing option", () => {
  describe("is a file", () => {
    it("should work", (done) => {
      runEmit({
        expectedAssetKeys: [],
        patterns: [
          {
            from: "unknown.unknown",
            noErrorOnMissing: true,
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe("is a directory", () => {
    it("should work", (done) => {
      runEmit({
        expectedAssetKeys: [],
        patterns: [
          {
            from: "unknown",
            noErrorOnMissing: true,
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });

  describe("is a glob", () => {
    it("should work", (done) => {
      runEmit({
        expectedAssetKeys: [],
        patterns: [
          {
            from: "*.unknown",
            noErrorOnMissing: true,
          },
        ],
      })
        .then(done)
        .catch(done);
    });
  });
});
