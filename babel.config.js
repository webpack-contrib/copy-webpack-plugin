const MIN_BABEL_VERSION = 7;

module.exports = (api) => {
  api.assertVersion(MIN_BABEL_VERSION);
  api.cache(true);

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          exclude: ["proposal-dynamic-import"],
          targets: {
            node: "18.12.0",
          },
        },
      ],
    ],
  };
};
