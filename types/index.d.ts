export = CopyPlugin;
declare class CopyPlugin {
  /**
   * @private
   * @param {Compilation} compilation the compilation
   * @param {number} startTime the start time of the snapshot creation
   * @param {string} dependency the dependency for which the snapshot is created
   * @returns {Promise<Snapshot | undefined>} creates a snapshot for the given dependency
   */
  private static createSnapshot;
  /**
   * @private
   * @param {Compilation} compilation the compilation
   * @param {Snapshot} snapshot /the snapshot to check
   * @returns {Promise<boolean | undefined>} checks if the snapshot is valid
   */
  private static checkSnapshotValid;
  /**
   * @private
   * @param {Compiler} compiler the compiler
   * @param {Compilation} compilation the compilation
   * @param {Buffer} source the source content to hash
   * @returns {string} returns the content hash of the source
   */
  private static getContentHash;
  /**
   * @private
   * @param {Compilation} compilation the compilation
   * @param {"file" | "dir" | "glob"} typeOfFrom the type of from
   * @param {string} absoluteFrom the source content to hash
   * @param {InputFileSystem | null} inputFileSystem input file system
   * @param {WebpackLogger} logger the logger to use for logging
   * @returns {Promise<void>}
   */
  private static addCompilationDependency;
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
  private static glob;
  /**
   * @param {PluginOptions=} options options for the plugin
   */
  constructor(options?: PluginOptions | undefined);
  /**
   * @private
   * @type {Pattern[]}
   */
  private patterns;
  /**
   * @private
   * @type {AdditionalOptions}
   */
  private options;
  /**
   * @param {Compiler} compiler the compiler
   */
  apply(compiler: Compiler): void;
}
declare namespace CopyPlugin {
  export {
    Schema,
    Compiler,
    Compilation,
    Asset,
    AssetInfo,
    InputFileSystem,
    GlobbyOptions,
    WebpackLogger,
    CacheFacade,
    Etag,
    Snapshot,
    Force,
    CopiedResult,
    StringPattern,
    NoErrorOnMissing,
    Context,
    From,
    ToFunction,
    To,
    ToType,
    TransformerFunction,
    TransformerCacheObject,
    TransformerObject,
    Transform,
    Filter,
    TransformAllFunction,
    Info,
    ObjectPattern,
    Pattern,
    AdditionalOptions,
    PluginOptions,
  };
}
type Schema = import("schema-utils/declarations/validate").Schema;
type Compiler = import("webpack").Compiler;
type Compilation = import("webpack").Compilation;
type Asset = import("webpack").Asset;
type AssetInfo = import("webpack").AssetInfo;
type InputFileSystem = import("webpack").InputFileSystem;
type GlobbyOptions = import("tinyglobby").GlobOptions;
type WebpackLogger = ReturnType<Compilation["getLogger"]>;
type CacheFacade = ReturnType<Compilation["getCache"]>;
type Etag = ReturnType<
  ReturnType<Compilation["getCache"]>["getLazyHashedEtag"]
>;
type Snapshot = ReturnType<Compilation["fileSystemInfo"]["mergeSnapshots"]>;
type Force = boolean;
type CopiedResult = {
  /**
   * relative path to the file from the context
   */
  sourceFilename: string;
  /**
   * absolute path to the file
   */
  absoluteFilename: string;
  /**
   * relative path to the file from the output path
   */
  filename: string;
  /**
   * source of the file
   */
  source: Asset["source"];
  /**
   * whether to force update the asset if it already exists
   */
  force: Force | undefined;
  /**
   * additional information about the asset
   */
  info: Record<string, unknown>;
};
type StringPattern = string;
type NoErrorOnMissing = boolean;
type Context = string;
type From = string;
type ToFunction = (pathData: {
  context: string;
  absoluteFilename?: string;
}) => string | Promise<string>;
type To = string | ToFunction;
type ToType = "dir" | "file" | "template";
type TransformerFunction = (
  input: Buffer,
  absoluteFilename: string,
) => string | Buffer | Promise<string> | Promise<Buffer>;
type TransformerCacheObject =
  | {
      keys: {
        [key: string]: unknown;
      };
    }
  | {
      keys: (
        defaultCacheKeys: {
          [key: string]: unknown;
        },
        absoluteFilename: string,
      ) => Promise<{
        [key: string]: unknown;
      }>;
    };
type TransformerObject = {
  /**
   * function to transform the file content
   */
  transformer: TransformerFunction;
  /**
   * whether to cache the transformed content or an object with keys for caching
   */
  cache?: (boolean | TransformerCacheObject) | undefined;
};
type Transform = TransformerFunction | TransformerObject;
type Filter = (filepath: string) => boolean | Promise<boolean>;
type TransformAllFunction = (
  data: {
    data: Buffer;
    sourceFilename: string;
    absoluteFilename: string;
  }[],
) => string | Buffer | Promise<string> | Promise<Buffer>;
type Info =
  | Record<string, unknown>
  | ((item: {
      absoluteFilename: string;
      sourceFilename: string;
      filename: string;
      toType: ToType;
    }) => Record<string, unknown>);
type ObjectPattern = {
  /**
   * source path or glob pattern to copy files from
   */
  from: From;
  /**
   * options for globbing
   */
  globOptions?: GlobbyOptions | undefined;
  /**
   * context for the source path or glob pattern
   */
  context?: Context | undefined;
  /**
   * destination path or function to determine the destination path
   */
  to?: To | undefined;
  /**
   * type of the destination path, can be "dir", "file" or "template"
   */
  toType?: ToType | undefined;
  /**
   * additional information about the asset
   */
  info?: Info | undefined;
  /**
   * function to filter files, if it returns false, the file will be skipped
   */
  filter?: Filter | undefined;
  /**
   * function to transform the file content, can be a function or an object with a transformer function and cache options
   */
  transform?: Transform | undefined;
  /**
   * function to transform all files, it receives an array of objects with data, sourceFilename and absoluteFilename properties
   */
  transformAll?: TransformAllFunction | undefined;
  /**
   * whether to force update the asset if it already exists
   */
  force?: Force | undefined;
  /**
   * priority of the pattern, patterns with higher priority will be processed first
   */
  priority?: number | undefined;
  /**
   * whether to skip errors when no files are found for the pattern
   */
  noErrorOnMissing?: NoErrorOnMissing | undefined;
};
type Pattern = StringPattern | ObjectPattern;
type AdditionalOptions = {
  /**
   * maximum number of concurrent operations, default is 100
   */
  concurrency?: number | undefined;
};
type PluginOptions = {
  /**
   * array of patterns to copy files from
   */
  patterns: Pattern[];
  /**
   * additional options for the plugin
   */
  options?: AdditionalOptions | undefined;
};
