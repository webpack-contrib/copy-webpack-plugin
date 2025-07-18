/** @typedef {import("webpack").Compilation["inputFileSystem"] } InputFileSystem */
/** @typedef {import("fs").Stats } Stats */

/**
 * @param {InputFileSystem} inputFileSystem // The input file system to use for reading the file stats.
 * @param {string} path // The path to the file or directory to get stats for.
 * @returns {Promise<undefined | Stats>} // A promise that resolves to the stats of the file or directory.
 */
function stat(inputFileSystem, path) {
  return new Promise((resolve, reject) => {
    inputFileSystem.stat(
      path,
      /**
       * @param {null | undefined | NodeJS.ErrnoException} err // An error that occurred while trying to get the stats.
       * @param {undefined | Stats} stats // The stats of the file or directory, if available.
       */
      // @ts-ignore
      (err, stats) => {
        if (err) {
          reject(err);

          return;
        }

        resolve(stats);
      },
    );
  });
}

/**
 * @param {InputFileSystem} inputFileSystem // The input file system to use for reading the file.
 * @param {string} path // The path to the file to read.
 * @returns {Promise<string | Buffer>} // A promise that resolves to the content of the file.
 */
function readFile(inputFileSystem, path) {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(
      path,
      /**
       * @param {null | undefined | NodeJS.ErrnoException} err // An error that occurred while trying to read the file.
       * @param {undefined | string | Buffer} data // The content of the file, if available.
       */
      (err, data) => {
        if (err) {
          reject(err);

          return;
        }

        resolve(/** @type {string | Buffer} */ (data));
      },
    );
  });
}

const notSettled = Symbol("not-settled");

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
function throttleAll(limit, tasks) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError(
      `Expected \`limit\` to be a finite number > 0, got \`${limit}\` (${typeof limit})`,
    );
  }

  if (
    !Array.isArray(tasks) ||
    !tasks.every((task) => typeof task === "function")
  ) {
    throw new TypeError(
      "Expected `tasks` to be a list of functions returning a promise",
    );
  }

  return new Promise((resolve, reject) => {
    const result = Array.from({ length: tasks.length }).fill(notSettled);

    const entries = tasks.entries();

    const next = () => {
      const { done, value } = entries.next();

      if (done) {
        const isLast = !result.includes(notSettled);

        if (isLast) {
          resolve(/** @type{T[]} * */ (result));
        }

        return;
      }

      const [index, task] = value;

      /**
       * @param {T} x // The result of the task that was fulfilled.
       */
      const onFulfilled = (x) => {
        result[index] = x;
        next();
      };

      task().then(onFulfilled, reject);
    };

    new Array(limit).fill(0).forEach(next);
  });
}

/**
 * @template T
 * @param fn {(function(): any) | undefined} // The function to memoize.
 * @returns {function(): T} // A memoized function that returns the result of the original function.
 */
function memoize(fn) {
  let cache = false;
  /** @type {T} */
  let result;

  return () => {
    if (cache) {
      return result;
    }

    result = /** @type {function(): any} */ (fn)();
    cache = true;
    // Allow to clean up memory for fn
    // and all dependent resources

    fn = undefined;

    return result;
  };
}

module.exports = { memoize, readFile, stat, throttleAll };
