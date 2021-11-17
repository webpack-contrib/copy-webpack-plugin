module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^globby$": "<rootDir>/test/bundled/globby/index.js",
  },
  globalSetup: "<rootDir>/globalSetup.js",
};
