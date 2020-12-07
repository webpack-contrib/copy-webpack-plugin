import path from "path";

import {run, runEmit} from "./helpers/run";

describe("info option", () => {
  it('should work', (done) => {
    run({
      expectedAssetKeys: ["file.txt"],
      patterns: [
        {
          from: "file.txt",
          info: {test: true},
        },
      ],
    })
      .then(({ compilation }) => {
        console.log(compilation.assetsInfo)
      })
      .then(done)
      .catch(done);
  });
});
