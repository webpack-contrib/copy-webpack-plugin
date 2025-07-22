import fs from "node:fs";

import { runEmit } from "./helpers/run";

describe('"filter" option', () => {
  it("should work, copy files and filter some of them", (done) => {
    runEmit({
      expectedAssetKeys: [
        ".dottedfile",
        "nested/deep-nested/deepnested.txt",
        "nested/nestedfile.txt",
      ],
      patterns: [
        {
          from: "directory",
          filter: (resourcePath) => {
            if (/directoryfile\.txt$/.test(resourcePath)) {
              return false;
            }

            return true;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should work, copy files and filter some of them using async function", (done) => {
    runEmit({
      expectedAssetKeys: [
        ".dottedfile",
        "nested/deep-nested/deepnested.txt",
        "nested/nestedfile.txt",
      ],
      patterns: [
        {
          from: "directory",
          filter: async (resourcePath) => {
            const data = await fs.promises.readFile(resourcePath);
            const content = data.toString();

            if (content === "new") {
              return false;
            }

            return true;
          },
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
