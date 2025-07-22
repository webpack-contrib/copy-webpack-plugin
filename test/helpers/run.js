// Ideally we pass in patterns and confirm the resulting assets
import fs from "node:fs";
import path from "node:path";

import CopyPlugin from "../../src/index";

import BreakContenthashPlugin from "./BreakContenthashPlugin";
import ChildCompilerPlugin from "./ChildCompiler";
import PreCopyPlugin from "./PreCopyPlugin";

import removeIllegalCharacterForWindows from "./removeIllegalCharacterForWindows";

import { compile, getCompiler, readAssets } from "./";

// ESLint disable for expect since this file is only used in test contexts
/* eslint-disable no-undef */

const isWin = process.platform === "win32";

const ignore = [
  "**/symlink/**/*",
  "**/file-ln.txt",
  "**/directory-ln",
  "**/watch/**/*",
];

/**
 * @param {{ patterns?: Array<unknown>, compiler?: unknown, preCopy?: unknown, breakContenthash?: unknown, withChildCompilation?: unknown, expectedErrors?: Array<Error>, expectedWarnings?: Array<Error> }} opts Options for running the test
 * @returns {Promise<{ compilation: unknown, compiler: unknown, stats: unknown }>} Resolves with compilation, compiler, and stats
 */
function run(opts) {
  return new Promise((resolve, reject) => {
    if (Array.isArray(opts.patterns)) {
      for (const pattern of opts.patterns) {
        if (pattern.context) {
          pattern.context = removeIllegalCharacterForWindows(pattern.context);
        }

        if (typeof pattern !== "string" && (!opts.symlink || isWin)) {
          pattern.globOptions ||= {};
          pattern.globOptions.ignore = [
            ...ignore,
            ...(pattern.globOptions.ignore || []),
          ];
        }
      }
    }

    const compiler = opts.compiler || getCompiler();

    if (opts.preCopy) {
      new PreCopyPlugin({ options: opts.preCopy }).apply(compiler);
    }

    if (opts.breakContenthash) {
      new BreakContenthashPlugin({ options: opts.breakContenthash }).apply(
        compiler,
      );
    }

    new CopyPlugin({ patterns: opts.patterns, options: opts.options }).apply(
      compiler,
    );

    if (opts.withChildCompilation) {
      new ChildCompilerPlugin().apply(compiler);
    }

    // Execute the functions in series
    compile(compiler)
      .then(({ stats }) => {
        const { compilation } = stats;

        if (opts.expectedErrors) {
          expect(compilation.errors).toEqual(opts.expectedErrors);
        } else if (compilation.errors.length > 0) {
          throw compilation.errors[0];
        }

        if (opts.expectedWarnings) {
          expect(compilation.warnings).toEqual(opts.expectedWarnings);
        } else if (compilation.warnings.length > 0) {
          throw compilation.warnings[0];
        }

        const enryPoint = path.resolve(__dirname, "enter.js");

        if (compilation.fileDependencies.has(enryPoint)) {
          compilation.fileDependencies.delete(enryPoint);
        }

        resolve({ compilation, compiler, stats });
      })
      .catch(reject);
  });
}

/**
 * @param {{ expectedAssetKeys?: Array<string>, expectedAssetContent?: { [key: string]: unknown }, skipAssetsTesting?: boolean }} opts Options for running the test
 * @returns {Promise<void>} Resolves when the test is complete
 */
function runEmit(opts) {
  return run(opts).then(({ compilation, compiler, stats }) => {
    if (opts.skipAssetsTesting) {
      return;
    }

    if (opts.expectedAssetKeys && opts.expectedAssetKeys.length > 0) {
      expect(
        Object.keys(compilation.assets)
          .filter((a) => a !== "main.js")
          .sort(),
      ).toEqual(
        opts.expectedAssetKeys.sort().map(removeIllegalCharacterForWindows),
      );
    } else {
      delete compilation.assets["main.js"];
      expect(compilation.assets).toEqual({});
    }

    if (opts.expectedAssetContent) {
      for (const assetName in opts.expectedAssetContent) {
        expect(compilation.assets[assetName]).toBeDefined();

        if (compilation.assets[assetName]) {
          let expectedContent = opts.expectedAssetContent[assetName];
          let compiledContent = readAssets(compiler, stats)[assetName];

          if (!Buffer.isBuffer(expectedContent)) {
            expectedContent = Buffer.from(expectedContent);
          }

          if (!Buffer.isBuffer(compiledContent)) {
            compiledContent = Buffer.from(compiledContent);
          }

          expect(Buffer.compare(expectedContent, compiledContent)).toBe(0);
        }
      }
    }
  });
}

/**
 * @param {{ compiler?: unknown }} opts Options for running the test
 * @returns {Promise<void>} Resolves when the test is complete
 */
function runForce(opts) {
  opts.compiler ||= getCompiler();

  new PreCopyPlugin({ options: opts }).apply(opts.compiler);

  return runEmit(opts).then(() => {});
}

/**
 * @param {number} ms Milliseconds to delay
 * @returns {Promise<void>} Resolves after the delay
 */
const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * @param {{ patterns?: Array<unknown>, options?: unknown, newFileLoc1?: string, newFileLoc2?: string, expectedAssetKeys?: Array<string> }} opts Options for running the test
 * @returns {Promise<void>} Resolves when the test is complete
 */
function runChange(opts) {
  return new Promise((resolve) => {
    const compiler = getCompiler();

    new CopyPlugin({ patterns: opts.patterns, options: opts.options }).apply(
      compiler,
    );

    // Create two test files
    fs.writeFileSync(opts.newFileLoc1, "file1contents");
    fs.writeFileSync(opts.newFileLoc2, "file2contents");

    const arrayOfStats = [];

    const watching = compiler.watch({}, (error, stats) => {
      if (error || stats.hasErrors()) {
        throw error;
      }

      arrayOfStats.push(stats);
    });

    delay(500)
      .then(() => {
        fs.appendFileSync(opts.newFileLoc1, "extra");

        return delay(500);
      })
      .then(() => {
        watching.close(() => {
          const assetsBefore = readAssets(compiler, arrayOfStats[0]);
          const assetsAfter = readAssets(compiler, arrayOfStats.pop());
          const filesForCompare = Object.keys(assetsBefore);
          const changedFiles = [];

          for (const file of filesForCompare) {
            if (assetsBefore[file] === assetsAfter[file]) {
              changedFiles.push(file);
            }
          }

          const lastFiles = Object.keys(assetsAfter);

          if (
            opts.expectedAssetKeys &&
            opts.expectedAssetKeys.length > 0 &&
            changedFiles.length > 0
          ) {
            expect(changedFiles.sort()).toEqual(
              opts.expectedAssetKeys
                .sort()
                .map(removeIllegalCharacterForWindows),
            );
          }

          if (lastFiles.length > 0) {
            expect(lastFiles.sort()).toEqual(Object.keys(assetsAfter).sort());
          }

          resolve();
        });
      });
  });
}

export { run, runChange, runEmit, runForce };
