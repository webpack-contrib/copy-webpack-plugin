const path = require("node:path");

const { validate } = require("schema-utils");

const { version } = require("../package.json");

const schema = require("./options.json");
const { memoize, readFile, stat, throttleAll } = require("./utils");

const template = /\[\\*([\w:]+)\\*\]/i;

const getNormalizePath = memoize(() => require("normalize-path"));

const getGlobParent = memoize(() => require("glob-parent"));

const getSerializeJavascript = memoize(() => require("serialize-javascript"));

const getTinyGlobby = memoize(() => require("tinyglobby"));

/** @typedef {import("schema-utils/declarations/validate").Schema} Schema */
/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack").Compilation} Compilation */
/** @typedef {import("webpack").WebpackError} WebpackError */
/** @typedef {import("webpack").Asset} Asset */
/** @typedef {import("webpack").AssetInfo} AssetInfo */
/** @typedef {import("tinyglobby").GlobOptions} GlobbyOptions */
/** @typedef {ReturnType<Compilation["getLogger"]>} WebpackLogger */
/** @typedef {ReturnType<Compilation["getCache"]>} CacheFacade */
/** @typedef {ReturnType<ReturnType<Compilation["getCache"]>["getLazyHashedEtag"]>} Etag */
/** @typedef {ReturnType<Compilation["fileSystemInfo"]["mergeSnapshots"]>} Snapshot */

/**
 * @typedef {boolean} Force
 */

/**
 * @typedef {object} CopiedResult
 * @property {string} sourceFilename relative path to the file from the context
 * @property {string} absoluteFilename absolute path to the file
 * @property {string} filename relative path to the file from the output path
 * @property {Asset["source"]} source source of the file
 * @property {Force | undefined} force whether to force update the asset if it already exists
 * @property {Record<string, unknown>} info additional information about the asset
 */

/**
 * @typedef {string} StringPattern
 */

/**
 * @typedef {boolean} NoErrorOnMissing
 */

/**
 * @typedef {string} Context
 */

/**
 * @typedef {string} From
 */

/**
 * @callback ToFunction
 * @param {{ context: string, absoluteFilename?: string }} pathData
 * @returns {string | Promise<string>}
 */

/**
 * @typedef {string | ToFunction} To
 */

/**
 * @typedef {"dir" | "file" | "template"} ToType
 */

/**
 * @callback TransformerFunction
 * @param {Buffer} input
 * @param {string} absoluteFilename
 * @returns {string | Buffer | Promise<string> | Promise<Buffer>}
 */

/**
 * @typedef {{ keys: { [key: string]: unknown } } | { keys: ((defaultCacheKeys: { [key: string]: unknown }, absoluteFilename: string) => Promise<{ [key: string]: unknown }>) }} TransformerCacheObject
 */

/**
 * @typedef {object} TransformerObject
 * @property {TransformerFunction} transformer function to transform the file content
 * @property {boolean | TransformerCacheObject=} cache whether to cache the transformed content or an object with keys for caching
 */

/**
 * @typedef {TransformerFunction | TransformerObject} Transform
 */

/**
 * @callback Filter
 * @param {string} filepath
 * @returns {boolean | Promise<boolean>}
 */

/**
 * @callback TransformAllFunction
 * @param {{ data: Buffer, sourceFilename: string, absoluteFilename: string }[]} data
 * @returns {string | Buffer | Promise<string> | Promise<Buffer>}
 */

/**
 * @typedef { Record<string, unknown> | ((item: { absoluteFilename: string, sourceFilename: string, filename: string, toType: ToType }) => Record<string, unknown>) } Info
 */

/**
 * @typedef {object} ObjectPattern
 * @property {From} from source path or glob pattern to copy files from
 * @property {GlobbyOptions=} globOptions options for globbing
 * @property {Context=} context context for the source path or glob pattern
 * @property {To=} to destination path or function to determine the destination path
 * @property {ToType=} toType type of the destination path, can be "dir", "file" or "template"
 * @property {Info=} info additional information about the asset
 * @property {Filter=} filter function to filter files, if it returns false, the file will be skipped
 * @property {Transform=} transform function to transform the file content, can be a function or an object with a transformer function and cache options
 * @property {TransformAllFunction=} transformAll function to transform all files, it receives an array of objects with data, sourceFilename and absoluteFilename properties
 * @property {Force=} force whether to force update the asset if it already exists
 * @property {number=} priority priority of the pattern, patterns with higher priority will be processed first
 * @property {NoErrorOnMissing=} noErrorOnMissing whether to skip errors when no files are found for the pattern
 */

/**
 * @typedef {StringPattern | ObjectPattern} Pattern
 */

/**
 * @typedef {object} AdditionalOptions
 * @property {number=} concurrency maximum number of concurrent operations, default is 100
 */

/**
 * @typedef {object} PluginOptions
 * @property {Pattern[]} patterns array of patterns to copy files from
 * @property {AdditionalOptions=} options additional options for the plugin
 */

const PLUGIN_NAME = "CopyPlugin";

class CopyPlugin {
  /**
   * @param {PluginOptions=} options options for the plugin
   */
  constructor(options = { patterns: [] }) {
    validate(/** @type {Schema} */ (schema), options, {
      name: "Copy Plugin",
      baseDataPath: "options",
    });

    /**
     * @private
     * @type {Pattern[]}
     */
    this.patterns = options.patterns;

    /**
     * @private
     * @type {AdditionalOptions}
     */
    this.options = options.options || {};
  }

  /**
   * @private
   * @param {Compilation} compilation the compilation
   * @param {number} startTime the start time of the snapshot creation
   * @param {string} dependency the dependency for which the snapshot is created
   * @returns {Promise<Snapshot | undefined>} creates a snapshot for the given dependency
   */
  static async createSnapshot(compilation, startTime, dependency) {
    return new Promise((resolve, reject) => {
      compilation.fileSystemInfo.createSnapshot(
        startTime,
        [dependency],
        null,
        null,
        null,
        (error, snapshot) => {
          if (error) {
            reject(error);

            return;
          }

          resolve(/** @type {Snapshot} */ (snapshot));
        },
      );
    });
  }

  /**
   * @private
   * @param {Compilation} compilation the compilation
   * @param {Snapshot} snapshot /the snapshot to check
   * @returns {Promise<boolean | undefined>} checks if the snapshot is valid
   */
  static async checkSnapshotValid(compilation, snapshot) {
    return new Promise((resolve, reject) => {
      compilation.fileSystemInfo.checkSnapshotValid(
        snapshot,
        (error, isValid) => {
          if (error) {
            reject(error);

            return;
          }

          resolve(isValid);
        },
      );
    });
  }

  /**
   * @private
   * @param {Compiler} compiler the compiler
   * @param {Compilation} compilation the compilation
   * @param {Buffer} source the source content to hash
   * @returns {string} returns the content hash of the source
   */
  static getContentHash(compiler, compilation, source) {
    const { outputOptions } = compilation;
    const { hashDigest, hashDigestLength, hashFunction, hashSalt } =
      outputOptions;
    const hash = compiler.webpack.util.createHash(
      /** @type {string} */
      (hashFunction),
    );

    if (hashSalt) {
      hash.update(hashSalt);
    }

    hash.update(source);

    const fullContentHash = hash.digest(hashDigest);

    return fullContentHash.toString().slice(0, hashDigestLength);
  }

  /**
   * @private
   * @param {typeof import("tinyglobby").glob} globby the globby function to use for globbing
   * @param {Compiler} compiler the compiler
   * @param {Compilation} compilation the compilation
   * @param {WebpackLogger} logger the logger to use for logging
   * @param {CacheFacade} cache the cache facade to use for caching
   * @param {number} concurrency /maximum number of concurrent operations
   * @param {ObjectPattern & { context: string }} pattern the pattern to process
   * @param {number} index the index of the pattern in the patterns array
   * @returns {Promise<Array<CopiedResult | undefined> | undefined>} processes the pattern and returns an array of copied results
   */
  static async glob(
    globby,
    compiler,
    compilation,
    logger,
    cache,
    concurrency,
    pattern,
    index,
  ) {
    const { RawSource } = compiler.webpack.sources;

    logger.log(
      `starting to process a pattern from '${pattern.from}' using '${pattern.context}' context`,
    );

    const absoluteFrom = path.isAbsolute(pattern.from)
      ? path.normalize(pattern.from)
      : path.resolve(pattern.context, pattern.from);

    logger.debug(`getting stats for '${absoluteFrom}'...`);

    const { inputFileSystem } = compiler;

    let stats;

    try {
      // @ts-expect-error - webpack types are incomplete
      stats = await stat(inputFileSystem, absoluteFrom);
    } catch {
      // Nothing
    }

    /**
     * @type {"file" | "dir" | "glob"}
     */
    let fromType;

    if (stats) {
      if (stats.isDirectory()) {
        fromType = "dir";
        logger.debug(`determined '${absoluteFrom}' is a directory`);
      } else if (stats.isFile()) {
        fromType = "file";
        logger.debug(`determined '${absoluteFrom}' is a file`);
      } else {
        // Fallback
        fromType = "glob";
        logger.debug(`determined '${absoluteFrom}' is unknown`);
      }
    } else {
      fromType = "glob";
      logger.debug(`determined '${absoluteFrom}' is a glob`);
    }

    /** @type {GlobbyOptions} */
    const globOptions = {
      absolute: true,
      followSymbolicLinks: true,
      ...pattern.globOptions,
      cwd: pattern.context,
      onlyFiles: true,
    };

    // Will work when https://github.com/SuperchupuDev/tinyglobby/issues/81 will be resolved, so let's pass it to `tinyglobby` right now
    // @ts-expect-error - tinyglobby types are incomplete
    globOptions.fs = inputFileSystem;

    let glob;

    switch (fromType) {
      case "dir":
        compilation.contextDependencies.add(absoluteFrom);

        logger.debug(`added '${absoluteFrom}' as a context dependency`);

        pattern.context = absoluteFrom;
        glob = path.posix.join(
          getTinyGlobby().escapePath(getNormalizePath()(absoluteFrom)),
          "**/*",
        );

        if (typeof globOptions.dot === "undefined") {
          globOptions.dot = true;
        }
        break;
      case "file":
        compilation.fileDependencies.add(absoluteFrom);

        logger.debug(`added '${absoluteFrom}' as a file dependency`);

        pattern.context = path.dirname(absoluteFrom);
        glob = getTinyGlobby().escapePath(getNormalizePath()(absoluteFrom));

        if (typeof globOptions.dot === "undefined") {
          globOptions.dot = true;
        }
        break;
      case "glob":
      default: {
        const contextDependencies = path.normalize(
          getGlobParent()(absoluteFrom),
        );

        compilation.contextDependencies.add(contextDependencies);

        logger.debug(`added '${contextDependencies}' as a context dependency`);

        glob = path.isAbsolute(pattern.from)
          ? pattern.from
          : path.posix.join(
              getTinyGlobby().escapePath(getNormalizePath()(pattern.context)),
              pattern.from,
            );
      }
    }

    logger.log(`begin globbing '${glob}'...`);

    /**
     * @type {string[]}
     */
    let globEntries;

    try {
      globEntries = await globby(glob, globOptions);
    } catch (error) {
      compilation.errors.push(/** @type {WebpackError} */ (error));

      return;
    }

    if (globEntries.length === 0) {
      if (pattern.noErrorOnMissing) {
        logger.log(
          `finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`,
        );

        return;
      }

      const missingError = new Error(`unable to locate '${glob}' glob`);

      compilation.errors.push(/** @type {WebpackError} */ (missingError));

      return;
    }

    /**
     * @type {Array<CopiedResult | undefined>}
     */
    let copiedResult;

    try {
      copiedResult = await throttleAll(
        concurrency,
        globEntries.map((globEntry) => async () => {
          if (pattern.filter) {
            let isFiltered;

            try {
              isFiltered = await pattern.filter(globEntry);
            } catch (error) {
              compilation.errors.push(/** @type {WebpackError} */ (error));

              return;
            }

            if (!isFiltered) {
              logger.log(`skip '${globEntry}', because it was filtered`);

              return;
            }
          }

          const from = globEntry;

          logger.debug(`found '${from}'`);

          const absoluteFilename = path.normalize(from);
          const to =
            typeof pattern.to === "function"
              ? await pattern.to({
                  context: pattern.context,
                  absoluteFilename,
                })
              : path.normalize(
                  typeof pattern.to !== "undefined" ? pattern.to : "",
                );
          const toType =
            pattern.toType ||
            (template.test(to)
              ? "template"
              : path.extname(to) === "" || to.slice(-1) === path.sep
                ? "dir"
                : "file");

          logger.log(`'to' option '${to}' determinated as '${toType}'`);

          const relativeFrom = path.relative(pattern.context, absoluteFilename);
          let filename = toType === "dir" ? path.join(to, relativeFrom) : to;

          if (path.isAbsolute(filename)) {
            filename = path.relative(
              /** @type {string} */
              (compiler.options.output.path),
              filename,
            );
          }

          logger.log(`determined that '${from}' should write to '${filename}'`);

          const sourceFilename = getNormalizePath()(
            path.relative(compiler.context, absoluteFilename),
          );

          // If this came from a glob or dir, add it to the file dependencies
          if (fromType === "dir" || fromType === "glob") {
            compilation.fileDependencies.add(absoluteFilename);

            logger.debug(`added '${absoluteFilename}' as a file dependency`);
          }

          let cacheEntry;

          logger.debug(`getting cache for '${absoluteFilename}'...`);

          try {
            cacheEntry = await cache.getPromise(
              `${sourceFilename}|${index}`,
              null,
            );
          } catch (error) {
            compilation.errors.push(/** @type {WebpackError} */ (error));

            return;
          }

          /**
           * @type {Asset["source"] | undefined}
           */
          let source;

          if (cacheEntry) {
            logger.debug(`found cache for '${absoluteFilename}'...`);

            let isValidSnapshot;

            logger.debug(
              `checking snapshot on valid for '${absoluteFilename}'...`,
            );

            try {
              isValidSnapshot = await CopyPlugin.checkSnapshotValid(
                compilation,
                cacheEntry.snapshot,
              );
            } catch (error) {
              compilation.errors.push(/** @type {WebpackError} */ (error));

              return;
            }

            if (isValidSnapshot) {
              logger.debug(`snapshot for '${absoluteFilename}' is valid`);

              ({ source } = cacheEntry);
            } else {
              logger.debug(`snapshot for '${absoluteFilename}' is invalid`);
            }
          } else {
            logger.debug(`missed cache for '${absoluteFilename}'`);
          }

          if (!source) {
            const startTime = Date.now();

            logger.debug(`reading '${absoluteFilename}'...`);

            let data;

            try {
              // @ts-expect-error - webpack types are incomplete
              data = await readFile(inputFileSystem, absoluteFilename);
            } catch (error) {
              compilation.errors.push(/** @type {WebpackError} */ (error));

              return;
            }

            logger.debug(`read '${absoluteFilename}'`);

            source = new RawSource(data);

            let snapshot;

            logger.debug(`creating snapshot for '${absoluteFilename}'...`);

            try {
              snapshot = await CopyPlugin.createSnapshot(
                compilation,
                startTime,
                absoluteFilename,
              );
            } catch (error) {
              compilation.errors.push(/** @type {WebpackError} */ (error));

              return;
            }

            if (snapshot) {
              logger.debug(`created snapshot for '${absoluteFilename}'`);
              logger.debug(`storing cache for '${absoluteFilename}'...`);

              try {
                await cache.storePromise(`${sourceFilename}|${index}`, null, {
                  source,
                  snapshot,
                });
              } catch (error) {
                compilation.errors.push(/** @type {WebpackError} */ (error));

                return;
              }

              logger.debug(`stored cache for '${absoluteFilename}'`);
            }
          }

          if (pattern.transform) {
            /**
             * @type {TransformerObject}
             */
            const transformObj =
              typeof pattern.transform === "function"
                ? { transformer: pattern.transform }
                : pattern.transform;

            if (transformObj.transformer) {
              logger.log(`transforming content for '${absoluteFilename}'...`);

              const buffer = source.buffer();

              if (transformObj.cache) {
                const hasher = compiler.webpack.util.createHash(
                  /** @type {string} */
                  (compilation.outputOptions.hashFunction),
                );

                const defaultCacheKeys = {
                  version,
                  sourceFilename,
                  transform: transformObj.transformer,
                  contentHash: hasher.update(buffer).digest("hex"),
                  index,
                };
                const cacheKeys = `transform|${getSerializeJavascript()(
                  typeof transformObj.cache === "boolean"
                    ? defaultCacheKeys
                    : typeof transformObj.cache.keys === "function"
                      ? await transformObj.cache.keys(
                          defaultCacheKeys,
                          absoluteFilename,
                        )
                      : { ...defaultCacheKeys, ...transformObj.cache.keys },
                )}`;

                logger.debug(
                  `getting transformation cache for '${absoluteFilename}'...`,
                );

                const cacheItem = cache.getItemCache(
                  cacheKeys,
                  cache.getLazyHashedEtag(source),
                );

                source = await cacheItem.getPromise();

                logger.debug(
                  source
                    ? `found transformation cache for '${absoluteFilename}'`
                    : `no transformation cache for '${absoluteFilename}'`,
                );

                if (!source) {
                  const transformed = await transformObj.transformer(
                    buffer,
                    absoluteFilename,
                  );

                  source = new RawSource(transformed);

                  logger.debug(
                    `caching transformation for '${absoluteFilename}'...`,
                  );

                  await cacheItem.storePromise(source);

                  logger.debug(
                    `cached transformation for '${absoluteFilename}'`,
                  );
                }
              } else {
                source = new RawSource(
                  await transformObj.transformer(buffer, absoluteFilename),
                );
              }
            }
          }

          /** @type {AssetInfo} */
          let info =
            typeof pattern.info === "undefined"
              ? {}
              : typeof pattern.info === "function"
                ? pattern.info({
                    absoluteFilename,
                    sourceFilename,
                    filename,
                    toType,
                  }) || {}
                : pattern.info || {};

          if (toType === "template") {
            logger.log(
              `interpolating template '${filename}' for '${sourceFilename}'...`,
            );

            const contentHash = CopyPlugin.getContentHash(
              compiler,
              compilation,
              source.buffer(),
            );
            const ext = path.extname(sourceFilename);
            const base = path.basename(sourceFilename);
            const name = base.slice(0, base.length - ext.length);
            const data = {
              filename: getNormalizePath()(relativeFrom),
              contentHash,
              chunk: {
                name,
                id: /** @type {string} */ (sourceFilename),
                hash: contentHash,
              },
            };
            const { path: interpolatedFilename, info: assetInfo } =
              compilation.getPathWithInfo(getNormalizePath()(filename), data);

            info = { ...info, ...assetInfo };
            filename = interpolatedFilename;

            logger.log(
              `interpolated template '${filename}' for '${sourceFilename}'`,
            );
          } else {
            filename = getNormalizePath()(filename);
          }

          return {
            sourceFilename,
            absoluteFilename,
            filename,
            source,
            info,
            force: pattern.force,
          };
        }),
      );
    } catch (error) {
      compilation.errors.push(/** @type {WebpackError} */ (error));

      return;
    }

    if (copiedResult.length === 0) {
      if (pattern.noErrorOnMissing) {
        logger.log(
          `finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`,
        );

        return;
      }

      const missingError = new Error(
        `unable to locate '${glob}' glob after filtering paths`,
      );

      compilation.errors.push(/** @type {WebpackError} */ (missingError));

      return;
    }

    logger.log(
      `finished to process a pattern from '${pattern.from}' using '${pattern.context}' context`,
    );

    return copiedResult;
  }

  /**
   * @param {Compiler} compiler the compiler
   */
  apply(compiler) {
    const pluginName = this.constructor.name;

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      const logger = compilation.getLogger("copy-webpack-plugin");
      const cache = compilation.getCache("CopyWebpackPlugin");

      /**
       * @type {typeof import("tinyglobby").glob}
       */
      let globby;

      compilation.hooks.processAssets.tapAsync(
        {
          name: PLUGIN_NAME,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        async (unusedAssets, callback) => {
          if (typeof globby === "undefined") {
            try {
              globby = await getTinyGlobby().glob;
            } catch (error) {
              callback(/** @type {Error} */ (error));

              return;
            }
          }

          logger.log("starting to add additional assets...");

          const concurrency = this.options.concurrency || 100;
          /** @type {Map<number, Map<number, CopiedResult[]>>} */
          const copiedResultMap = new Map();

          await throttleAll(
            // Should be enough, it might be worth considering an option for this, but in real configurations it usually doesn't exceed this value
            // https://github.com/webpack-contrib/copy-webpack-plugin/issues/627
            2,
            this.patterns.map((item, index) => async () => {
              /**
               * @type {ObjectPattern}
               */
              const pattern =
                typeof item === "string" ? { from: item } : { ...item };
              const context =
                typeof pattern.context === "undefined"
                  ? compiler.context
                  : path.isAbsolute(pattern.context)
                    ? pattern.context
                    : path.join(compiler.context, pattern.context);

              pattern.context = context;

              /**
               * @type {Array<CopiedResult | undefined> | undefined}
               */
              let copiedResult;

              try {
                copiedResult = await CopyPlugin.glob(
                  globby,
                  compiler,
                  compilation,
                  logger,
                  cache,
                  concurrency,
                  /** @type {ObjectPattern & { context: string }} */
                  (pattern),
                  index,
                );
              } catch (error) {
                compilation.errors.push(/** @type {WebpackError} */ (error));

                return;
              }

              if (!copiedResult) {
                return;
              }

              /**
               * @type {Array<CopiedResult>}
               */
              let filteredCopiedResult = copiedResult.filter(
                /**
                 * @param {CopiedResult | undefined} result The result to filter
                 * @returns {result is CopiedResult} True if the result is defined
                 */
                (result) => result !== undefined,
              );

              if (typeof pattern.transformAll !== "undefined") {
                if (typeof pattern.to === "undefined") {
                  compilation.errors.push(
                    /** @type {WebpackError} */
                    (
                      new Error(
                        `Invalid "pattern.to" for the "pattern.from": "${pattern.from}" and "pattern.transformAll" function. The "to" option must be specified.`,
                      )
                    ),
                  );

                  return;
                }

                filteredCopiedResult.sort((a, b) =>
                  a.absoluteFilename > b.absoluteFilename
                    ? 1
                    : a.absoluteFilename < b.absoluteFilename
                      ? -1
                      : 0,
                );

                const mergedEtag =
                  filteredCopiedResult.length === 1
                    ? cache.getLazyHashedEtag(filteredCopiedResult[0].source)
                    : filteredCopiedResult.reduce(
                        /**
                         * @param {Etag} accumulator merged Etag accumulator
                         * @param {CopiedResult} asset /copied asset to merge Etag with
                         * @param {number} i index of the asset in the array
                         * @returns {Etag} merged Etag
                         */
                        // @ts-expect-error - webpack cache types are incomplete
                        (accumulator, asset, i) => {
                          accumulator = cache.mergeEtags(
                            i === 1
                              ? cache.getLazyHashedEtag(
                                  /** @type {CopiedResult} */ (accumulator)
                                    .source,
                                )
                              : accumulator,
                            cache.getLazyHashedEtag(asset.source),
                          );

                          return accumulator;
                        },
                      );

                const cacheItem = cache.getItemCache(
                  `transformAll|${getSerializeJavascript()({
                    version,
                    from: pattern.from,
                    to: pattern.to,
                    transformAll: pattern.transformAll,
                  })}`,
                  mergedEtag,
                );
                let transformedAsset = await cacheItem.getPromise();

                if (!transformedAsset) {
                  transformedAsset = { filename: pattern.to };

                  try {
                    transformedAsset.data = await pattern.transformAll(
                      filteredCopiedResult.map((asset) => ({
                        data: asset.source.buffer(),
                        sourceFilename: asset.sourceFilename,
                        absoluteFilename: asset.absoluteFilename,
                      })),
                    );
                  } catch (error) {
                    compilation.errors.push(
                      /** @type {WebpackError} */ (error),
                    );

                    return;
                  }

                  const filename =
                    typeof pattern.to === "function"
                      ? await pattern.to({ context })
                      : pattern.to;

                  if (template.test(filename)) {
                    const contentHash = CopyPlugin.getContentHash(
                      compiler,
                      compilation,
                      transformedAsset.data,
                    );

                    const { path: interpolatedFilename, info: assetInfo } =
                      compilation.getPathWithInfo(
                        getNormalizePath()(filename),
                        {
                          contentHash,
                          chunk: {
                            id: "unknown-copied-asset",
                            hash: contentHash,
                          },
                        },
                      );

                    transformedAsset.filename = interpolatedFilename;
                    transformedAsset.info = assetInfo;
                  }

                  const { RawSource } = compiler.webpack.sources;

                  transformedAsset.source = new RawSource(
                    transformedAsset.data,
                  );
                  transformedAsset.force = pattern.force;

                  await cacheItem.storePromise(transformedAsset);
                }

                filteredCopiedResult = [transformedAsset];
              }

              const priority = pattern.priority || 0;

              if (!copiedResultMap.has(priority)) {
                copiedResultMap.set(priority, new Map());
              }

              /** @type {Map<index, CopiedResult[]>} */
              (copiedResultMap.get(priority)).set(index, filteredCopiedResult);
            }),
          );

          const copiedResult = [...copiedResultMap.entries()].sort(
            (a, b) => a[0] - b[0],
          );

          // Avoid writing assets inside `throttleAll`, because it creates concurrency.
          // It could potentially lead to an error - 'Multiple assets emit different content to the same filename'
          for (const result of copiedResult
            .reduce(
              (acc, val) => {
                const sortedByIndex = [...val[1]].sort((a, b) => a[0] - b[0]);

                for (const [, item] of sortedByIndex) {
                  acc = [...acc, ...item];
                }

                return acc;
              },
              /** @type {CopiedResult[]} */
              ([]),
            )
            .filter(Boolean)) {
            const {
              absoluteFilename,
              sourceFilename,
              filename,
              source,
              force,
            } = result;

            const existingAsset = compilation.getAsset(filename);

            if (existingAsset) {
              if (force) {
                const info = { copied: true, sourceFilename };

                logger.log(
                  `force updating '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists...`,
                );

                compilation.updateAsset(filename, source, {
                  ...info,
                  ...result.info,
                });

                logger.log(
                  `force updated '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists`,
                );

                continue;
              }

              logger.log(
                `skip adding '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists`,
              );

              continue;
            }

            const info = { copied: true, sourceFilename };

            logger.log(
              `writing '${filename}' from '${absoluteFilename}' to compilation assets...`,
            );

            compilation.emitAsset(filename, source, {
              ...info,
              ...result.info,
            });

            logger.log(
              `written '${filename}' from '${absoluteFilename}' to compilation assets`,
            );
          }

          logger.log("finished to adding additional assets");

          callback();
        },
      );

      if (compilation.hooks.statsPrinter) {
        compilation.hooks.statsPrinter.tap(pluginName, (stats) => {
          stats.hooks.print
            .for("asset.info.copied")
            .tap(PLUGIN_NAME, (copied, { green, formatFlag }) =>
              copied
                ? /** @type {(text: string) => string} */ (green)(
                    /** @type {(flag: string) => string} */ (formatFlag)(
                      "copied",
                    ),
                  )
                : "",
            );
        });
      }
    });
  }
}

module.exports = CopyPlugin;
