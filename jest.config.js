module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^globby$": "<rootDir>/test/bundled/globby/index.js",
    "^node:fs$": "<rootDir>/test/helpers/built-in-modules/fs.js",
    "^node:util$": "<rootDir>/test/helpers/built-in-modules/util.js",
    "^node:path$": "<rootDir>/test/helpers/built-in-modules/path.js",
    "^node:url$": "<rootDir>/test/helpers/built-in-modules/url.js",
    "^node:process$": "<rootDir>/test/helpers/built-in-modules/process.js",
    "^node:stream$": "<rootDir>/test/helpers/built-in-modules/stream.js",
  },
  globalSetup: "<rootDir>/globalSetup.js",
};
