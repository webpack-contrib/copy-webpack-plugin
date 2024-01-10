import path from "path";

import { runEmit } from "./helpers/run";

const FIXTURES_DIR_NORMALIZED = path
  .join(__dirname, "fixtures")
  .replace(/\\/g, "/");

describe("toType option", () => {
  it("should copy a file to a new file", (done) => {
    runEmit({
      expectedAssetKeys: ["new-file.txt"],
      patterns: [
        {
          from: "file.txt",
          to: "new-file.txt",
          toType: "file",
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should copy a file to a new directory", (done) => {
    runEmit({
      expectedAssetKeys: ["new-file.txt/file.txt"],
      patterns: [
        {
          from: "file.txt",
          to: "new-file.txt",
          toType: "dir",
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should copy a file to a new directory", (done) => {
    runEmit({
      expectedAssetKeys: [
        "directory/directoryfile.txt-new-directoryfile.txt.5d7817ed5bc246756d73.47e8bdc316eff74b2d6e-47e8bdc316eff74b2d6e.txt",
      ],
      patterns: [
        {
          from: "directory/directoryfile.*",
          to: "[path][base]-new-[name][ext].[contenthash].[hash]-[fullhash][ext]",
          toType: "template",
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should copy a file to a new file with no extension", (done) => {
    runEmit({
      expectedAssetKeys: ["newname"],
      patterns: [
        {
          from: "file.txt",
          to: "newname",
          toType: "file",
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should copy a file to a new directory with an extension", (done) => {
    runEmit({
      expectedAssetKeys: ["newdirectory.ext/file.txt"],
      patterns: [
        {
          from: "file.txt",
          to: "newdirectory.ext",
          toType: "dir",
        },
      ],
    })
      .then(done)
      .catch(done);
  });

  it("should warn when file not found and stats is undefined", (done) => {
    runEmit({
      expectedAssetKeys: [],
      expectedErrors: [
        new Error(
          `unable to locate '${FIXTURES_DIR_NORMALIZED}/nonexistent.txt' glob`,
        ),
      ],
      patterns: [
        {
          from: "nonexistent.txt",
          to: ".",
          toType: "dir",
        },
      ],
    })
      .then(done)
      .catch(done);
  });
});
