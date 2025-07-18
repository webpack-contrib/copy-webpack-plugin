class PreCopyPlugin {
  constructor(options = {}) {
    this.options = options.options || {};
  }

  apply(compiler) {
    const plugin = { name: "PreCopyPlugin" };

    compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
      compilation.hooks.additionalAssets.tapAsync(
        "pre-copy-webpack-plugin",
        (callback) => {
          for (const { name, data, info } of this.options.additionalAssets) {
            const { RawSource } = compiler.webpack.sources;
            const source = new RawSource(data);

            compilation.emitAsset(name, source, info);
          }

          callback();
        },
      );
    });
  }
}

export default PreCopyPlugin;
