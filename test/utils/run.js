import path from 'path';
import fs from 'fs';

import CopyPlugin from '../../src';

import removeIllegalCharacterForWindows from './removeIllegalCharacterForWindows';
import { MockCompiler } from './mock';

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

    // Get a mock compiler to pass to plugin.apply
    const compiler = opts.compiler || new MockCompiler();

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

      opts.options.ignore.push('symlink/**/*', 'file-ln.txt', 'directory-ln');
    }

    new CopyPlugin(opts.patterns, opts.options).apply(compiler);

    // Call the registered function with a mock compilation and callback
    const compilation = Object.assign(
      {
        assets: {},
        errors: [],
        warnings: [],
        fileDependencies: new Set(),
        contextDependencies: new Set(),
      },
      opts.compilation
    );

    // Execute the functions in series
    return Promise.resolve()
      .then(
        () =>
          new Promise((res, rej) => {
            try {
              compiler.hooks.emit(compilation, res);
            } catch (error) {
              rej(error);
            }
          })
      )
      .then(
        () =>
          new Promise((res, rej) => {
            try {
              compiler.hooks.afterEmit(compilation, res);
            } catch (error) {
              rej(error);
            }
          })
      )
      .then(() => {
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
      expect(Object.keys(compilation.assets).sort()).toEqual(
        opts.expectedAssetKeys
          .sort()
          .map(removeIllegalCharacterForWindows)
          .map((item) => item.replace(/\//g, path.sep))
      );
    } else {
      expect(compilation.assets).toEqual({});
    }

    if (opts.expectedAssetContent) {
      // eslint-disable-next-line guard-for-in
      for (const key in opts.expectedAssetContent) {
        const assetName = key.replace(/(\/|\\)/g, path.sep);

        expect(compilation.assets[assetName]).toBeDefined();

        if (compilation.assets[assetName]) {
          let expectedContent = opts.expectedAssetContent[key];

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
  opts.compilation = {
    assets: {},
  };
  // eslint-disable-next-line no-param-reassign
  opts.compilation.assets[opts.existingAsset] = {
    source() {
      return 'existing';
    },
  };

  return run(opts).then(() => {});
}

function runChange(opts) {
  // Create two test files
  fs.writeFileSync(opts.newFileLoc1, 'file1contents');
  fs.writeFileSync(opts.newFileLoc2, 'file2contents');

  // Create a reference to the compiler
  const compiler = new MockCompiler();
  const compilation = {
    assets: {},
    errors: [],
    warnings: [],
    fileDependencies: new Set(),
    contextDependencies: new Set(),
  };

  return run({
    compiler,
    options: opts.options,
    patterns: opts.patterns,
  })
    .then(() => {
      // Change a file
      fs.appendFileSync(opts.newFileLoc1, 'extra');

      // Trigger another compile
      return new Promise((res) => {
        compiler.hooks.emit(compilation, res);
      });
    })
    .then(() => {
      if (opts.expectedAssetKeys && opts.expectedAssetKeys.length > 0) {
        expect(Object.keys(compilation.assets).sort()).toEqual(
          opts.expectedAssetKeys
            .sort()
            .map(removeIllegalCharacterForWindows)
            .map((item) => item.replace(/\//g, path.sep))
        );
      } else {
        expect(compilation.assets).toEqual({});
      }
    })
    .then(() => {
      // Todo finally and check file exists
      fs.unlinkSync(opts.newFileLoc1);
      fs.unlinkSync(opts.newFileLoc2);
    });
}

export { run, runEmit, runForce, runChange };
