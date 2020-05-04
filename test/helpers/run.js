// Ideally we pass in patterns and confirm the resulting assets
import fs from 'fs';
import path from 'path';

import CopyPlugin from '../../src';

import PreCopyPlugin from './PreCopyPlugin';

import removeIllegalCharacterForWindows from './removeIllegalCharacterForWindows';

import { compile, getCompiler } from './';

function run(opts) {
  return new Promise((resolve, reject) => {
    if (Array.isArray(opts.patterns)) {
      opts.patterns.forEach((pattern) => {
        if (pattern.context) {
          // eslint-disable-next-line no-param-reassign
          pattern.context = removeIllegalCharacterForWindows(pattern.context);
        }
      });
    }

    const compiler = opts.compiler || getCompiler();

    const isWin = process.platform === 'win32';

    if (!opts.symlink || isWin) {
      if (!opts.options) {
        // eslint-disable-next-line no-param-reassign
        opts.options = {};
      }

      if (!opts.options.ignore) {
        // eslint-disable-next-line no-param-reassign
        opts.options.ignore = [];
      }

      opts.options.ignore.push(
        'symlink/**/*',
        'file-ln.txt',
        'directory-ln',
        'watch/**/*'
      );
    }

    new CopyPlugin({ patterns: opts.patterns, options: opts.options }).apply(
      compiler
    );

    // Execute the functions in series
    return compile(compiler)
      .then((stats) => {
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

        const enryPoint = path.resolve(__dirname, 'enter.js');

        if (compilation.fileDependencies.has(enryPoint)) {
          compilation.fileDependencies.delete(enryPoint);
        }

        resolve(compilation);
      })
      .catch(reject);
  });
}

function runEmit(opts) {
  return run(opts).then((compilation) => {
    if (opts.skipAssetsTesting) {
      return;
    }

    if (opts.expectedAssetKeys && opts.expectedAssetKeys.length > 0) {
      expect(
        Object.keys(compilation.assets)
          .filter((a) => a !== 'main.js')
          .sort()
      ).toEqual(
        opts.expectedAssetKeys.sort().map(removeIllegalCharacterForWindows)
      );
    } else {
      // eslint-disable-next-line no-param-reassign
      delete compilation.assets['main.js'];
      expect(compilation.assets).toEqual({});
    }

    if (opts.expectedAssetContent) {
      // eslint-disable-next-line guard-for-in
      for (const assetName in opts.expectedAssetContent) {
        expect(compilation.assets[assetName]).toBeDefined();

        if (compilation.assets[assetName]) {
          let expectedContent = opts.expectedAssetContent[assetName];

          if (!Buffer.isBuffer(expectedContent)) {
            expectedContent = Buffer.from(expectedContent);
          }

          let compiledContent = compilation.assets[assetName].source();

          if (!Buffer.isBuffer(compiledContent)) {
            compiledContent = Buffer.from(compiledContent);
          }

          expect(Buffer.compare(expectedContent, compiledContent)).toBe(0);
        }
      }
    }
  });
}

function runForce(opts) {
  // eslint-disable-next-line no-param-reassign
  opts.compiler = getCompiler();

  new PreCopyPlugin({ options: opts }).apply(opts.compiler);

  return runEmit(opts).then(() => {});
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function runChange(opts) {
  return new Promise(async (resolve) => {
    const compiler = getCompiler();

    new CopyPlugin({ patterns: opts.patterns, options: opts.options }).apply(
      compiler
    );

    // Create two test files
    fs.writeFileSync(opts.newFileLoc1, 'file1contents');
    fs.writeFileSync(opts.newFileLoc2, 'file2contents');

    const arrayOfStats = [];

    const watching = compiler.watch({}, (error, stats) => {
      if (error || stats.hasErrors()) {
        throw error;
      }

      arrayOfStats.push(stats);
    });

    await delay(500);

    fs.appendFileSync(opts.newFileLoc1, 'extra');

    await delay(500);

    watching.close(() => {
      const statsBefore = arrayOfStats[0].compilation.assets;
      const statsAfter = arrayOfStats.pop().compilation.assets;
      const filesForCompare = Object.keys(statsBefore);
      const changedFiles = [];

      filesForCompare
        .filter((file) => file !== 'main.js')
        .forEach((file) => {
          if (
            Buffer.compare(
              statsBefore[file].source(),
              statsAfter[file].source()
            ) !== 0
          ) {
            changedFiles.push(file);
          }
        });

      const lastFiles = Object.keys(statsAfter).filter(
        (file) => file !== 'main.js'
      );

      if (
        opts.expectedAssetKeys &&
        opts.expectedAssetKeys.length > 0 &&
        changedFiles.length > 0
      ) {
        expect(lastFiles.sort()).toEqual(
          opts.expectedAssetKeys.sort().map(removeIllegalCharacterForWindows)
        );
      } else {
        expect(lastFiles).toEqual({});
      }

      resolve(watching);
    });
    // eslint-disable-next-line no-unused-vars
  }).then((watching) => {
    // eslint-disable-next-line no-param-reassign
    watching = null;

    fs.unlinkSync(opts.newFileLoc1);
    fs.unlinkSync(opts.newFileLoc2);
  });
}

export { run, runChange, runEmit, runForce };
