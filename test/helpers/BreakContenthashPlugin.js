class BreakContenthashPlugin {
  constructor(options = {}) {
    this.options = options.options || {};
  }

  apply(compiler) {
    const plugin = { name: "BrokeContenthashPlugin" };

    compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        {
          name: "broken-contenthash-webpack-plugin",
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (unusedAssets, callback) => {
          this.options.targetAssets.forEach(({ name, newName, newHash }) => {
            const asset = compilation.getAsset(name);

            compilation.updateAsset(asset.name, asset.source, {
              ...asset.info,
              contenthash: newHash,
            });
            compilation.renameAsset(asset.name, newName);
          });

          callback();
        },
      );
    });
  }
}

export default BreakContenthashPlugin;
