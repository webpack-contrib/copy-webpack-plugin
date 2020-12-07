import path from "path";
import os from "os";
import crypto from "crypto";

import webpack from "webpack";
import { validate } from "schema-utils";
import pLimit from "p-limit";
import globby from "globby";
import findCacheDir from "find-cache-dir";
import serialize from "serialize-javascript";
import cacache from "cacache";
import loaderUtils from "loader-utils";
import normalizePath from "normalize-path";
import globParent from "glob-parent";
import fastGlob from "fast-glob";

import { version } from "../package.json";

import schema from "./options.json";
import { readFile, stat } from "./utils/promisify";

// webpack 5 exposes the sources property to ensure the right version of webpack-sources is used
const { RawSource } =
  // eslint-disable-next-line global-require
  webpack.sources || require("webpack-sources");

const template = /(\[ext\])|(\[name\])|(\[path\])|(\[folder\])|(\[emoji(?::(\d+))?\])|(\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\])|(\[\d+\])/;

class CopyPlugin {
  constructor(options = {}) {
    validate(schema, options, {
      name: "Copy Plugin",
      baseDataPath: "options",
    });

    this.patterns = options.patterns;
    this.options = options.options || {};
  }

  static async createSnapshot(compilation, startTime, dependency) {
    if (!compilation.fileSystemInfo) {
      return;
    }

    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      compilation.fileSystemInfo.createSnapshot(
        startTime,
        [dependency],
        // eslint-disable-next-line no-undefined
        undefined,
        // eslint-disable-next-line no-undefined
        undefined,
        null,
        (error, snapshot) => {
          if (error) {
            reject(error);

            return;
          }

          resolve(snapshot);
        }
      );
    });
  }

  static async checkSnapshotValid(compilation, snapshot) {
    if (!compilation.fileSystemInfo) {
      return;
    }

    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      compilation.fileSystemInfo.checkSnapshotValid(
        snapshot,
        (error, isValid) => {
          if (error) {
            reject(error);

            return;
          }

          resolve(isValid);
        }
      );
    });
  }

  static async runPattern(
    compiler,
    compilation,
    logger,
    cache,
    inputPattern,
    index
  ) {
    const pattern =
      typeof inputPattern === "string"
        ? { from: inputPattern }
        : { ...inputPattern };

    pattern.fromOrigin = pattern.from;
    pattern.from = path.normalize(pattern.from);
    pattern.compilerContext = compiler.context;
    pattern.context = path.normalize(
      typeof pattern.context !== "undefined"
        ? !path.isAbsolute(pattern.context)
          ? path.join(pattern.compilerContext, pattern.context)
          : pattern.context
        : pattern.compilerContext
    );

    logger.log(
      `starting to process a pattern from '${pattern.from}' using '${pattern.context}' context`
    );

    if (path.isAbsolute(pattern.from)) {
      pattern.absoluteFrom = pattern.from;
    } else {
      pattern.absoluteFrom = path.resolve(pattern.context, pattern.from);
    }

    logger.debug(`getting stats for '${pattern.absoluteFrom}'...`);

    const { inputFileSystem } = compiler;

    let stats;

    try {
      stats = await stat(inputFileSystem, pattern.absoluteFrom);
    } catch (error) {
      // Nothing
    }

    if (stats) {
      if (stats.isDirectory()) {
        pattern.fromType = "dir";
        logger.debug(`determined '${pattern.absoluteFrom}' is a directory`);
      } else if (stats.isFile()) {
        pattern.fromType = "file";
        logger.debug(`determined '${pattern.absoluteFrom}' is a file`);
      } else {
        logger.debug(`determined '${pattern.absoluteFrom}' is a glob`);
      }
    }

    // eslint-disable-next-line no-param-reassign
    pattern.globOptions = {
      ...{ followSymbolicLinks: true },
      ...(pattern.globOptions || {}),
      ...{ cwd: pattern.context, objectMode: true },
    };

    // TODO remove after drop webpack@4
    if (
      inputFileSystem.lstat &&
      inputFileSystem.stat &&
      inputFileSystem.lstatSync &&
      inputFileSystem.statSync &&
      inputFileSystem.readdir &&
      inputFileSystem.readdirSync
    ) {
      pattern.globOptions.fs = inputFileSystem;
    }

    switch (pattern.fromType) {
      case "dir":
        compilation.contextDependencies.add(pattern.absoluteFrom);

        logger.debug(`added '${pattern.absoluteFrom}' as a context dependency`);

        /* eslint-disable no-param-reassign */
        pattern.context = pattern.absoluteFrom;
        pattern.glob = path.posix.join(
          fastGlob.escapePath(
            normalizePath(path.resolve(pattern.absoluteFrom))
          ),
          "**/*"
        );
        pattern.absoluteFrom = path.join(pattern.absoluteFrom, "**/*");

        if (typeof pattern.globOptions.dot === "undefined") {
          pattern.globOptions.dot = true;
        }
        /* eslint-enable no-param-reassign */
        break;
      case "file":
        compilation.fileDependencies.add(pattern.absoluteFrom);

        logger.debug(`added '${pattern.absoluteFrom}' as a file dependency`);

        /* eslint-disable no-param-reassign */
        pattern.context = path.dirname(pattern.absoluteFrom);
        pattern.glob = fastGlob.escapePath(
          normalizePath(path.resolve(pattern.absoluteFrom))
        );

        if (typeof pattern.globOptions.dot === "undefined") {
          pattern.globOptions.dot = true;
        }
        /* eslint-enable no-param-reassign */
        break;
      default: {
        const contextDependencies = path.normalize(
          globParent(pattern.absoluteFrom)
        );

        compilation.contextDependencies.add(contextDependencies);

        logger.debug(`added '${contextDependencies}' as a context dependency`);

        /* eslint-disable no-param-reassign */
        pattern.fromType = "glob";
        pattern.glob = path.isAbsolute(pattern.fromOrigin)
          ? pattern.fromOrigin
          : path.posix.join(
              fastGlob.escapePath(normalizePath(path.resolve(pattern.context))),
              pattern.fromOrigin
            );
        /* eslint-enable no-param-reassign */
      }
    }

    logger.log(`begin globbing '${pattern.glob}'...`);

    let paths;

    try {
      paths = await globby(pattern.glob, pattern.globOptions);
    } catch (error) {
      compilation.errors.push(error);

      return;
    }

    if (paths.length === 0) {
      if (pattern.noErrorOnMissing) {
        logger.log(
          `finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`
        );

        return;
      }

      const missingError = new Error(`unable to locate '${pattern.glob}' glob`);

      compilation.errors.push(missingError);

      return;
    }

    const filteredPaths = (
      await Promise.all(
        paths.map(async (item) => {
          // Exclude directories
          if (!item.dirent.isFile()) {
            return false;
          }

          if (pattern.filter) {
            let isFiltered;

            try {
              isFiltered = await pattern.filter(item.path);
            } catch (error) {
              compilation.errors.push(error);

              return false;
            }

            if (!isFiltered) {
              logger.log(`skip '${item.path}', because it was filtered`);
            }

            return isFiltered ? item : false;
          }

          return item;
        })
      )
    ).filter((item) => item);

    if (filteredPaths.length === 0) {
      // TODO should be error in the next major release
      logger.log(
        `finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`
      );

      return;
    }

    const files = await Promise.all(
      filteredPaths.map(async (item) => {
        const from = item.path;

        logger.debug(`found '${from}'`);

        // `globby`/`fast-glob` return the relative path when the path contains special characters on windows
        const absoluteFilename = path.resolve(pattern.context, from);

        pattern.to =
          typeof pattern.to !== "function"
            ? path.normalize(
                typeof pattern.to !== "undefined" ? pattern.to : ""
              )
            : await pattern.to(pattern.context, absoluteFilename);

        const isToDirectory =
          path.extname(pattern.to) === "" || pattern.to.slice(-1) === path.sep;

        switch (true) {
          // if toType already exists
          case !!pattern.toType:
            break;
          case template.test(pattern.to):
            pattern.toType = "template";
            break;
          case isToDirectory:
            pattern.toType = "dir";
            break;
          default:
            pattern.toType = "file";
        }

        logger.log(
          `'to' option '${pattern.to}' determinated as '${pattern.toType}'`
        );

        const relativeFrom = pattern.flatten
          ? path.basename(absoluteFilename)
          : path.relative(pattern.context, absoluteFilename);
        let filename =
          pattern.toType === "dir"
            ? path.join(pattern.to, relativeFrom)
            : pattern.to;

        if (path.isAbsolute(filename)) {
          filename = path.relative(compiler.options.output.path, filename);
        }

        logger.log(`determined that '${from}' should write to '${filename}'`);

        const sourceFilename = normalizePath(
          path.relative(pattern.compilerContext, absoluteFilename)
        );

        return { absoluteFilename, sourceFilename, filename };
      })
    );

    let assets;

    try {
      assets = await Promise.all(
        files.map(async (file) => {
          const { absoluteFilename, sourceFilename, filename } = file;
          const result = {
            absoluteFilename,
            sourceFilename,
            filename,
            force: pattern.force,
          };

          // If this came from a glob or dir, add it to the file dependencies
          if (pattern.fromType === "dir" || pattern.fromType === "glob") {
            compilation.fileDependencies.add(absoluteFilename);

            logger.debug(`added '${absoluteFilename}' as a file dependency`);
          }

          if (cache) {
            let cacheEntry;

            logger.debug(`getting cache for '${absoluteFilename}'...`);

            try {
              cacheEntry = await cache.getPromise(
                `${sourceFilename}|${index}`,
                null
              );
            } catch (error) {
              compilation.errors.push(error);

              return;
            }

            if (cacheEntry) {
              logger.debug(`found cache for '${absoluteFilename}'...`);

              let isValidSnapshot;

              logger.debug(
                `checking snapshot on valid for '${absoluteFilename}'...`
              );

              try {
                isValidSnapshot = await CopyPlugin.checkSnapshotValid(
                  compilation,
                  cacheEntry.snapshot
                );
              } catch (error) {
                compilation.errors.push(error);

                return;
              }

              if (isValidSnapshot) {
                logger.debug(`snapshot for '${absoluteFilename}' is valid`);

                result.source = cacheEntry.source;
              } else {
                logger.debug(`snapshot for '${absoluteFilename}' is invalid`);
              }
            } else {
              logger.debug(`missed cache for '${absoluteFilename}'`);
            }
          }

          if (!result.source) {
            let startTime;

            if (cache) {
              startTime = Date.now();
            }

            logger.debug(`reading '${absoluteFilename}'...`);

            let data;

            try {
              data = await readFile(inputFileSystem, absoluteFilename);
            } catch (error) {
              compilation.errors.push(error);

              return;
            }

            logger.debug(`read '${absoluteFilename}'`);

            result.source = new RawSource(data);

            if (cache) {
              let snapshot;

              logger.debug(`creating snapshot for '${absoluteFilename}'...`);

              try {
                snapshot = await CopyPlugin.createSnapshot(
                  compilation,
                  startTime,
                  absoluteFilename
                );
              } catch (error) {
                compilation.errors.push(error);

                return;
              }

              if (snapshot) {
                logger.debug(`created snapshot for '${absoluteFilename}'`);
                logger.debug(`storing cache for '${absoluteFilename}'...`);

                try {
                  await cache.storePromise(`${sourceFilename}|${index}`, null, {
                    source: result.source,
                    snapshot,
                  });
                } catch (error) {
                  compilation.errors.push(error);

                  return;
                }

                logger.debug(`stored cache for '${absoluteFilename}'`);
              }
            }
          }

          if (pattern.transform) {
            logger.log(`transforming content for '${absoluteFilename}'...`);

            const buffer = result.source.source();

            if (pattern.cacheTransform) {
              const defaultCacheKeys = {
                version,
                sourceFilename,
                transform: pattern.transform,
                contentHash: crypto
                  .createHash("md4")
                  .update(buffer)
                  .digest("hex"),
                index,
              };
              const cacheKeys = `transform|${serialize(
                typeof pattern.cacheTransform.keys === "function"
                  ? await pattern.cacheTransform.keys(
                      defaultCacheKeys,
                      absoluteFilename
                    )
                  : { ...defaultCacheKeys, ...pattern.cacheTransform.keys }
              )}`;

              let cacheItem;
              let cacheDirectory;

              logger.debug(
                `getting transformation cache for '${absoluteFilename}'...`
              );

              // webpack@5 API
              if (cache) {
                cacheItem = cache.getItemCache(
                  cacheKeys,
                  cache.getLazyHashedEtag(result.source)
                );

                result.source = await cacheItem.getPromise();
              } else {
                cacheDirectory = pattern.cacheTransform.directory
                  ? pattern.cacheTransform.directory
                  : typeof pattern.cacheTransform === "string"
                  ? pattern.cacheTransform
                  : findCacheDir({ name: "copy-webpack-plugin" }) ||
                    os.tmpdir();

                let cached;

                try {
                  cached = await cacache.get(cacheDirectory, cacheKeys);
                } catch (error) {
                  logger.debug(
                    `no transformation cache for '${absoluteFilename}'...`
                  );
                }

                // eslint-disable-next-line no-undefined
                result.source = cached ? new RawSource(cached.data) : undefined;
              }

              logger.debug(
                result.source
                  ? `found transformation cache for '${absoluteFilename}'`
                  : `no transformation cache for '${absoluteFilename}'`
              );

              if (!result.source) {
                const transformed = await pattern.transform(
                  buffer,
                  absoluteFilename
                );

                result.source = new RawSource(transformed);

                logger.debug(
                  `caching transformation for '${absoluteFilename}'...`
                );

                // webpack@5 API
                if (cache) {
                  await cacheItem.storePromise(result.source);
                } else {
                  try {
                    await cacache.put(cacheDirectory, cacheKeys, transformed);
                  } catch (error) {
                    compilation.errors.push(error);

                    return;
                  }
                }

                logger.debug(`cached transformation for '${absoluteFilename}'`);
              }
            } else {
              result.source = new RawSource(
                await pattern.transform(buffer, absoluteFilename)
              );
            }
          }

          if (pattern.toType === "template") {
            logger.log(
              `interpolating template '${filename}' for '${sourceFilename}'...`
            );

            // If it doesn't have an extension, remove it from the pattern
            // ie. [name].[ext] or [name][ext] both become [name]
            if (!path.extname(absoluteFilename)) {
              // eslint-disable-next-line no-param-reassign
              result.filename = result.filename.replace(/\.?\[ext]/g, "");
            }

            // eslint-disable-next-line no-param-reassign
            result.immutable = /\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi.test(
              result.filename
            );

            // eslint-disable-next-line no-param-reassign
            result.filename = loaderUtils.interpolateName(
              { resourcePath: absoluteFilename },
              result.filename,
              {
                content: result.source.source(),
                context: pattern.context,
              }
            );

            // Bug in `loader-utils`, package convert `\\` to `/`, need fix in loader-utils
            // eslint-disable-next-line no-param-reassign
            result.filename = path.normalize(result.filename);

            logger.log(
              `interpolated template '${filename}' for '${sourceFilename}'`
            );
          }

          if (pattern.transformPath) {
            logger.log(
              `transforming '${result.filename}' for '${absoluteFilename}'...`
            );

            // eslint-disable-next-line no-param-reassign
            result.immutable = false;
            // eslint-disable-next-line no-param-reassign
            result.filename = await pattern.transformPath(
              result.filename,
              absoluteFilename
            );
            logger.log(
              `transformed new '${result.filename}' for '${absoluteFilename}'...`
            );
          }

          // eslint-disable-next-line no-param-reassign
          result.filename = normalizePath(result.filename);

          // eslint-disable-next-line consistent-return
          return result;
        })
      );
    } catch (error) {
      compilation.errors.push(error);

      return;
    }

    logger.log(
      `finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`
    );

    // eslint-disable-next-line consistent-return
    return assets;
  }

  apply(compiler) {
    const pluginName = this.constructor.name;
    const limit = pLimit(this.options.concurrency || 100);

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      const logger = compilation.getLogger("copy-webpack-plugin");
      const cache = compilation.getCache
        ? compilation.getCache("CopyWebpackPlugin")
        : // eslint-disable-next-line no-undefined
          undefined;

      compilation.hooks.additionalAssets.tapAsync(
        "copy-webpack-plugin",
        async (callback) => {
          logger.log("starting to add additional assets...");

          let assets;

          try {
            assets = await Promise.all(
              this.patterns.map((item, index) =>
                limit(async () =>
                  CopyPlugin.runPattern(
                    compiler,
                    compilation,
                    logger,
                    cache,
                    item,
                    index
                  )
                )
              )
            );
          } catch (error) {
            compilation.errors.push(error);

            callback();

            return;
          }

          // Avoid writing assets inside `p-limit`, because it creates concurrency.
          // It could potentially lead to an error - 'Multiple assets emit different content to the same filename'
          assets
            .reduce((acc, val) => acc.concat(val), [])
            .filter(Boolean)
            .forEach((asset) => {
              const {
                absoluteFilename,
                sourceFilename,
                filename,
                source,
                force,
              } = asset;

              // For old version webpack 4
              /* istanbul ignore if */
              if (typeof compilation.emitAsset !== "function") {
                // eslint-disable-next-line no-param-reassign
                compilation.assets[filename] = source;

                return;
              }

              const existingAsset = compilation.getAsset(filename);

              if (existingAsset) {
                if (force) {
                  const info = { copied: true, sourceFilename };

                  if (asset.immutable) {
                    info.immutable = true;
                  }

                  logger.log(
                    `force updating '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists...`
                  );

                  compilation.updateAsset(filename, source, info);

                  logger.log(
                    `force updated '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists`
                  );

                  return;
                }

                logger.log(
                  `skip adding '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists`
                );

                return;
              }

              logger.log(
                `writing '${filename}' from '${absoluteFilename}' to compilation assets...`
              );

              const info = { copied: true, sourceFilename };

              if (asset.immutable) {
                info.immutable = true;
              }

              compilation.emitAsset(filename, source, info);

              logger.log(
                `written '${filename}' from '${absoluteFilename}' to compilation assets`
              );
            });

          logger.log("finished to adding additional assets");

          callback();
        }
      );

      if (compilation.hooks.statsPrinter) {
        compilation.hooks.statsPrinter.tap(pluginName, (stats) => {
          stats.hooks.print
            .for("asset.info.copied")
            .tap("copy-webpack-plugin", (copied, { green, formatFlag }) =>
              // eslint-disable-next-line no-undefined
              copied ? green(formatFlag("copied")) : undefined
            );
        });
      }
    });
  }
}

export default CopyPlugin;
