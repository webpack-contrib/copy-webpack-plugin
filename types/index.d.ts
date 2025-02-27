export = CopyPlugin;
declare class CopyPlugin {
  /**
   * @private
   * @param {Compilation} compilation
   * @param {number} startTime
   * @param {string} dependency
   * @returns {Promise<Snapshot | undefined>}
   */
  private static createSnapshot;
  /**
   * @private
   * @param {Compilation} compilation
   * @param {Snapshot} snapshot
   * @returns {Promise<boolean | undefined>}
   */
  private static checkSnapshotValid;
  /**
   * @private
   * @param {Compiler} compiler
   * @param {Compilation} compilation
   * @param {Buffer} source
   * @returns {string}
   */
  private static getContentHash;
  /**
   * @private
   * @param {typeof import("tinyglobby").glob} globby
   * @param {Compiler} compiler
   * @param {Compilation} compilation
   * @param {WebpackLogger} logger
   * @param {CacheFacade} cache
   * @param {number} concurrency
   * @param {ObjectPattern & { context: string }} inputPattern
   * @param {number} index
   * @returns {Promise<Array<CopiedResult | undefined> | undefined>}
   */
  private static glob;
  /**
   * @param {PluginOptions} [options]
   */
  constructor(options?: PluginOptions);
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
   * @param {Compiler} compiler
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
  sourceFilename: string;
  absoluteFilename: string;
  filename: string;
  source: Asset["source"];
  force: Force | undefined;
  info: Record<string, any>;
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
        [key: string]: any;
      };
    }
  | {
      keys: (
        defaultCacheKeys: {
          [key: string]: any;
        },
        absoluteFilename: string,
      ) => Promise<{
        [key: string]: any;
      }>;
    };
type TransformerObject = {
  transformer: TransformerFunction;
  cache?: boolean | TransformerCacheObject | undefined;
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
  | Record<string, any>
  | ((item: {
      absoluteFilename: string;
      sourceFilename: string;
      filename: string;
      toType: ToType;
    }) => Record<string, any>);
type ObjectPattern = {
  from: From;
  globOptions?: import("tinyglobby").GlobOptions | undefined;
  context?: string | undefined;
  to?: To | undefined;
  toType?: ToType | undefined;
  info?: Info | undefined;
  filter?: Filter | undefined;
  transform?: Transform | undefined;
  transformAll?: TransformAllFunction | undefined;
  force?: boolean | undefined;
  priority?: number | undefined;
  noErrorOnMissing?: boolean | undefined;
};
type Pattern = StringPattern | ObjectPattern;
type AdditionalOptions = {
  concurrency?: number | undefined;
};
type PluginOptions = {
  patterns: Pattern[];
  options?: AdditionalOptions | undefined;
};
