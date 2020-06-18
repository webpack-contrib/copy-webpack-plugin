class PreCopyPlugin {
  constructor(options = {}) {
    this.options = options.options || {};
  }

  apply(compiler) {
    const plugin = { name: 'PreCopyPlugin' };

    compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
      compilation.hooks.additionalAssets.tapAsync(
        'copy-webpack-plugin',
        (callback) => {
          this.options.existingAssets.forEach((assetName) => {
            // eslint-disable-next-line no-param-reassign
            compilation.assets[assetName] = {
              source() {
                return 'existing';
              },
            };
          });

          callback();
        }
      );
    });
  }
}

export default PreCopyPlugin;
