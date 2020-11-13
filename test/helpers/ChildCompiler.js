export default class ChildCompiler {
  // eslint-disable-next-line class-methods-use-this
  apply(compiler) {
    compiler.hooks.make.tapAsync("Child Compiler", (compilation, callback) => {
      const outputOptions = {
        filename: "output.js",
        publicPath: compilation.outputOptions.publicPath,
      };
      const childCompiler = compilation.createChildCompiler(
        "ChildCompiler",
        outputOptions
      );
      childCompiler.runAsChild((error, entries, childCompilation) => {
        if (error) {
          throw error;
        }

        const assets = childCompilation.getAssets();

        if (assets.length > 0) {
          callback(
            new Error("Copy plugin should not be ran in child compilations")
          );

          return;
        }

        callback();
      });
    });
  }
}
