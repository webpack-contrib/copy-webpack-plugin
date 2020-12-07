import os from "os";

import findCacheDir from "find-cache-dir";

import CopyPlugin from "../src/index";

describe("validate options", () => {
  const tests = {
    patterns: {
      success: [
        ["test.txt"],
        ["test.txt", "test-other.txt"],
        [
          "test.txt",
          {
            from: "test.txt",
            to: "dir",
            context: "context",
          },
        ],
        [
          {
            from: "test.txt",
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
          },
        ],
        [
          {
            from: "test.txt",
            to: () => {},
          },
        ],
        [
          {
            from: "test.txt",
            context: "context",
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            toType: "file",
            force: true,
            flatten: true,
            transform: () => {},
            cacheTransform: true,
            transformPath: () => {},
            noErrorOnMissing: true,
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            globOptions: {
              dot: false,
            },
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform:
              findCacheDir({ name: "copy-webpack-plugin-a" }) || os.tmpdir(),
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: {
              keys: {
                foo: "bar",
              },
            },
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: {
              keys: () => ({
                foo: "bar",
              }),
            },
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: {
              keys: async () => ({
                foo: "bar",
              }),
            },
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: {
              directory:
                findCacheDir({ name: "copy-webpack-plugin-b" }) || os.tmpdir(),
              keys: {
                foo: "bar",
              },
            },
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: {
              directory:
                findCacheDir({ name: "copy-webpack-plugin-c" }) || os.tmpdir(),
              keys: () => ({
                foo: "bar",
              }),
            },
          },
        ],
        [
          {
            from: "test.txt",
            filter: () => true,
          },
        ],
      ],
      failure: [
        // eslint-disable-next-line no-undefined
        undefined,
        true,
        "true",
        "",
        {},
        [],
        [""],
        [{}],
        [
          {
            from: "",
            to: "dir",
            context: "context",
          },
        ],
        [
          {
            from: true,
            to: "dir",
            context: "context",
          },
        ],
        [
          {
            from: "test.txt",
            to: true,
            context: "context",
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: true,
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            toType: "foo",
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            force: "true",
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            flatten: "true",
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: () => {},
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            cacheTransform: {
              foo: "bar",
            },
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            transform: true,
          },
        ],
        [
          {
            from: "test.txt",
            to: "dir",
            context: "context",
            transformPath: true,
          },
        ],
        [
          {
            from: {
              glob: "**/*",
              dot: false,
            },
            to: "dir",
            context: "context",
          },
        ],
        [
          {
            from: "",
            to: "dir",
            context: "context",
            noErrorOnMissing: "true",
          },
        ],
        [
          {
            from: "test.txt",
            filter: "test",
          },
        ],
      ],
    },
    options: {
      success: [{ concurrency: 50 }],
      failure: [{ unknown: true }, { concurrency: true }],
    },
    unknown: {
      success: [],
      failure: [1, true, false, "test", /test/, [], {}, { foo: "bar" }],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === "object" && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === "success" ? "successfully validate" : "throw an error on"
    } the "${key}" option with "${stringifyValue(value)}" value`, async () => {
      let error;

      try {
        // eslint-disable-next-line no-new
        new CopyPlugin(
          key === "options"
            ? { patterns: [{ from: "file.txt" }], [key]: value }
            : { [key]: value }
        );
      } catch (errorFromPlugin) {
        if (errorFromPlugin.name !== "ValidationError") {
          throw errorFromPlugin;
        }

        error = errorFromPlugin;
      } finally {
        if (type === "success") {
          expect(error).toBeUndefined();
        } else if (type === "failure") {
          expect(() => {
            throw error;
          }).toThrowErrorMatchingSnapshot();
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
