class PreCopyPlugin {
  constructor(options = {}) {
    this.options = options.options || {};
  }

  apply(compiler) {
    const plugin = { name: 'PreCopyPlugin' };

    compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
      this.options.existingAssets.forEach((assetName) => {
        // eslint-disable-next-line no-param-reassign
        compilation.assets[assetName] = {
          source() {
            return 'existing';
          },
        };
      });

      callback();
    });
  }
}

export default PreCopyPlugin;
