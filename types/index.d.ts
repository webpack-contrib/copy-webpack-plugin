export = CopyPlugin;
declare class CopyPlugin {
  /**
   * @private
   * @param {Compilation} compilation // The current compilation
   * @param {number} startTime // The start time of the snapshot creation
   * @param {string} dependency // The dependency for which the snapshot is created
   * @returns {Promise<Snapshot | undefined>} // Creates a snapshot for the given dependency
   */
  private static createSnapshot;
  /**
   * @private
   * @param {Compilation} compilation // The current compilation
   * @param {Snapshot} snapshot // The snapshot to check
   * @returns {Promise<boolean | undefined>} // Checks if the snapshot is valid
   */
  private static checkSnapshotValid;
  /**
   * @private
   * @param {Compiler} compiler // The current compiler
   * @param {Compilation} compilation // The current compilation
   * @param {Buffer} source // The source content to hash
   * @returns {string} // Returns the content hash of the source
   */
  private static getContentHash;
  /**
   * @private
   * @param {typeof import("tinyglobby").glob} globby // The globby function to use for globbing
   * @param {Compiler} compiler // The current compiler
   * @param {Compilation} compilation // The current compilation
   * @param {WebpackLogger} logger // The logger to use for logging
   * @param {CacheFacade} cache // The cache facade to use for caching
   * @param {number} concurrency // Maximum number of concurrent operations
   * @param {ObjectPattern & { context: string }} inputPattern // The pattern to process
   * @param {number} index // The index of the pattern in the patterns array
   * @returns {Promise<Array<CopiedResult | undefined> | undefined>} // Processes the pattern and returns an array of copied results
   */
  private static glob;
  /**
   * @param {PluginOptions=} options // Options for the plugin
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
   * @param {Compiler} compiler // The current compiler
   */
  apply(compiler: Compiler): void;
}
declare namespace CopyPlugin {
  export {
    Schema,
    Compiler,
    Compilation,
    WebpackError,
    Asset,
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
type WebpackError = import("webpack").WebpackError;
type Asset = import("webpack").Asset;
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
   * // Relative path to the file from the context
   */
  sourceFilename: string;
  /**
   * // Absolute path to the file
   */
  absoluteFilename: string;
  /**
   * // Relative path to the file from the output path
   */
  filename: string;
  /**
   * // Source of the file
   */
  source: Asset["source"];
  /**
   * // Whether to force update the asset if it already exists
   */
  force: Force | undefined;
  /**
   * // Additional information about the asset
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
   * // Function to transform the file content
   */
  transformer: TransformerFunction;
  /**
   * // Whether to cache the transformed content or an object with keys for caching
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
   * // Source path or glob pattern to copy files from
   */
  from: From;
  /**
   * // Options for globbing
   */
  globOptions?: GlobbyOptions | undefined;
  /**
   * // Context for the source path or glob pattern
   */
  context?: Context | undefined;
  /**
   * // Destination path or function to determine the destination path
   */
  to?: To | undefined;
  /**
   * // Type of the destination path, can be "dir", "file" or "template"
   */
  toType?: ToType | undefined;
  /**
   * // Additional information about the asset
   */
  info?: Info | undefined;
  /**
   * // Function to filter files, if it returns false, the file will be skipped
   */
  filter?: Filter | undefined;
  /**
   * // Function to transform the file content, can be a function or an object with a transformer function and cache options
   */
  transform?: Transform | undefined;
  /**
   * // Function to transform all files, it receives an array of objects with data, sourceFilename and absoluteFilename properties
   */
  transformAll?: TransformAllFunction | undefined;
  /**
   * // Whether to force update the asset if it already exists
   */
  force?: Force | undefined;
  /**
   * // Priority of the pattern, patterns with higher priority will be processed first
   */
  priority?: number | undefined;
  /**
   * // Whether to skip errors when no files are found for the pattern
   */
  noErrorOnMissing?: NoErrorOnMissing | undefined;
};
type Pattern = StringPattern | ObjectPattern;
type AdditionalOptions = {
  /**
   * // Maximum number of concurrent operations, default is 100
   */
  concurrency?: number | undefined;
};
type PluginOptions = {
  /**
   * // Array of patterns to copy files from
   */
  patterns: Pattern[];
  /**
   * // Additional options for the plugin
   */
  options?: AdditionalOptions | undefined;
};
