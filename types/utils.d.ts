export type InputFileSystem = import("webpack").Compilation["inputFileSystem"];
export type Stats = import("fs").Stats;
export type Task<T> = () => Promise<T>;
/**
 * @template T
 * @param {(() => unknown) | undefined} fn The function to memoize.
 * @returns {() => T} A memoized function that returns the result of the original function.
 */
export function memoize<T>(fn: (() => unknown) | undefined): () => T;
/**
 * @param {InputFileSystem} inputFileSystem the input file system to use for reading the file.
 * @param {string} path the path to the file to read.
 * @returns {Promise<string | Buffer>} a promise that resolves to the content of the file.
 */
export function readFile(
  inputFileSystem: InputFileSystem,
  path: string,
): Promise<string | Buffer>;
/** @typedef {import("webpack").Compilation["inputFileSystem"] } InputFileSystem */
/** @typedef {import("fs").Stats } Stats */
/**
 * @param {InputFileSystem} inputFileSystem the input file system to use for reading the file stats.
 * @param {string} path the path to the file or directory to get stats for.
 * @returns {Promise<undefined | Stats>} a promise that resolves to the stats of the file or directory.
 */
export function stat(
  inputFileSystem: InputFileSystem,
  path: string,
): Promise<undefined | Stats>;
/**
 * @template T
 * @typedef {() => Promise<T>} Task
 */
/**
 * Run tasks with limited concurrency.
 * @template T
 * @param {number} limit Limit of tasks that run at once.
 * @param {Task<T>[]} tasks List of tasks to run.
 * @returns {Promise<T[]>} A promise that fulfills to an array of the results
 */
export function throttleAll<T>(limit: number, tasks: Task<T>[]): Promise<T[]>;
