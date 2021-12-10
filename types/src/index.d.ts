export default CopyPlugin;
export type Schema = import("schema-utils/declarations/validate").Schema;
export type Compiler = import("webpack").Compiler;
export type Compilation = import("webpack").Compilation;
export type WebpackError = import("webpack").WebpackError;
export type Asset = import("webpack").Asset;
export type GlobbyOptions = import("globby").Options;
export type GlobEntry = import("globby").GlobEntry;
export type WebpackLogger = ReturnType<Compilation["getLogger"]>;
export type CacheFacade = ReturnType<Compilation["getCache"]>;
export type Etag = ReturnType<
  ReturnType<Compilation["getCache"]>["getLazyHashedEtag"]
>;
export type Snapshot = ReturnType<
  Compilation["fileSystemInfo"]["mergeSnapshots"]
>;
export type Force = boolean;
export type CopiedResult = {
  sourceFilename: string;
  absoluteFilename: string;
  filename: string;
  source: Asset["source"];
  force: Force | undefined;
  info: {
    [key: string]: string;
  };
};
export type StringPattern = string;
export type NoErrorOnMissing = boolean;
export type Context = string;
export type From = string;
export type ToFunction = (pathData: {
  context: string;
  absoluteFilename?: string;
}) => string;
export type To = string | ToFunction;
export type ToType = "dir" | "file" | "template";
export type TransformerFunction = (
  input: Buffer,
  absoluteFilename: string
) => any;
export type TransformerCacheObject =
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
        absoluteFilename: string
      ) => Promise<{
        [key: string]: any;
      }>;
    };
export type TransformerObject = {
  transformer: TransformerFunction;
  cache?: boolean | TransformerCacheObject | undefined;
};
export type Transform = TransformerFunction | TransformerObject;
export type Filter = (filepath: string) => any;
export type TransformAllFunction = (
  data: {
    data: Buffer;
    sourceFilename: string;
    absoluteFilename: string;
  }[]
) => any;
export type Info =
  | {
      [key: string]: string;
    }
  | ((item: {
      absoluteFilename: string;
      sourceFilename: string;
      filename: string;
      toType: ToType;
    }) => {
      [key: string]: string;
    });
export type ObjectPattern = {
  from: From;
  globOptions?: import("globby").Options | undefined;
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
export type Pattern = StringPattern | ObjectPattern;
export type AdditionalOptions = {
  concurrency?: number | undefined;
};
export type PluginOptions = {
  patterns: Pattern[];
  options?: AdditionalOptions | undefined;
};
/** @typedef {import("schema-utils/declarations/validate").Schema} Schema */
/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack").Compilation} Compilation */
/** @typedef {import("webpack").WebpackError} WebpackError */
/** @typedef {import("webpack").Asset} Asset */
/** @typedef {import("globby").Options} GlobbyOptions */
/** @typedef {import("globby").GlobEntry} GlobEntry */
/** @typedef {ReturnType<Compilation["getLogger"]>} WebpackLogger */
/** @typedef {ReturnType<Compilation["getCache"]>} CacheFacade */
/** @typedef {ReturnType<ReturnType<Compilation["getCache"]>["getLazyHashedEtag"]>} Etag */
/** @typedef {ReturnType<Compilation["fileSystemInfo"]["mergeSnapshots"]>} Snapshot */
/**
 * @typedef {boolean} Force
 */
/**
 * @typedef {Object} CopiedResult
 * @property {string} sourceFilename
 * @property {string} absoluteFilename
 * @property {string} filename
 * @property {Asset["source"]} source
 * @property {Force | undefined} force
 * @property {{ [key: string]: string }} info
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
 * @return {string}
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
 */
/**
 * @typedef {{ keys: { [key: string]: any } } | { keys: ((defaultCacheKeys: { [key: string]: any }, absoluteFilename: string) => Promise<{ [key: string]: any }>) }} TransformerCacheObject
 */
/**
 * @typedef {Object} TransformerObject
 * @property {TransformerFunction} transformer
 * @property {boolean | TransformerCacheObject} [cache]
 */
/**
 * @typedef {TransformerFunction | TransformerObject} Transform
 */
/**
 * @callback Filter
 * @param {string} filepath
 */
/**
 * @callback TransformAllFunction
 * @param {{ data: Buffer, sourceFilename: string, absoluteFilename: string }[]} data
 */
/**
 * @typedef { { [key: string]: string } | ((item: { absoluteFilename: string, sourceFilename: string, filename: string, toType: ToType }) => { [key: string]: string }) } Info
 */
/**
 * @typedef {Object} ObjectPattern
 * @property {From} from
 * @property {GlobbyOptions} [globOptions]
 * @property {Context} [context]
 * @property {To} [to]
 * @property {ToType} [toType]
 * @property {Info} [info]
 * @property {Filter} [filter]
 * @property {Transform} [transform]
 * @property {TransformAllFunction} [transformAll]
 * @property {Force} [force]
 * @property {number} [priority]
 * @property {NoErrorOnMissing} [noErrorOnMissing]
 */
/**
 * @typedef {StringPattern | ObjectPattern} Pattern
 */
/**
 * @typedef {Object} AdditionalOptions
 * @property {number} [concurrency]
 */
/**
 * @typedef {Object} PluginOptions
 * @property {Pattern[]} patterns
 * @property {AdditionalOptions} [options]
 */
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
   * @param {typeof import("globby").globby} globby
   * @param {Compiler} compiler
   * @param {Compilation} compilation
   * @param {WebpackLogger} logger
   * @param {CacheFacade} cache
   * @param {ObjectPattern & { context: string }} inputPattern
   * @param {number} index
   * @returns {Promise<Array<CopiedResult | undefined> | undefined>}
   */
  private static runPattern;
  /**
   * @param {PluginOptions} [options]
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
   * @param {Compiler} compiler
   */
  apply(compiler: Compiler): void;
}
