import path from 'path';

import preProcessPattern from './preProcessPattern';
import processPattern from './processPattern';

class CopyPlugin {
  constructor(patterns = [], options = {}) {
    if (!Array.isArray(patterns)) {
      throw new Error('[copy-webpack-plugin] patterns must be an array');
    }

    this.patterns = patterns;
    this.options = options;
  }

  apply(compiler) {
    // Defaults debug level to 'warning'
    // eslint-disable-next-line no-param-reassign
    this.options.debug = this.options.debug || 'warning';

    // Defaults debugging to info if only true is specified
    if (this.options.debug === true) {
      // eslint-disable-next-line no-param-reassign
      this.options.debug = 'info';
    }

    const debugLevels = ['warning', 'info', 'debug'];
    const debugLevelIndex = debugLevels.indexOf(this.options.debug);

    function log(msg, level) {
      if (level === 0) {
        // eslint-disable-next-line no-param-reassign
        msg = `WARNING - ${msg}`;
      } else {
        // eslint-disable-next-line no-param-reassign
        level = level || 1;
      }

      if (level <= debugLevelIndex) {
        console.log(`[copy-webpack-plugin] ${msg}`); // eslint-disable-line no-console
      }
    }

    function warning(msg) {
      log(msg, 0);
    }

    function info(msg) {
      log(msg, 1);
    }

    function debug(msg) {
      log(msg, 2);
    }

    let fileDependencies;
    let contextDependencies;
    const written = {};

    let context;

    if (!this.options.context) {
      ({ context } = compiler.options);
    } else if (!path.isAbsolute(this.options.context)) {
      context = path.join(compiler.options.context, this.options.context);
    } else {
      ({ context } = this.options);
    }

    const emit = (compilation, cb) => {
      debug('starting emit');

      const callback = () => {
        debug('finishing emit');
        cb();
      };

      fileDependencies = [];
      contextDependencies = [];

      const globalRef = {
        info,
        debug,
        warning,
        compilation,
        written,
        fileDependencies,
        contextDependencies,
        context,
        inputFileSystem: compiler.inputFileSystem,
        output: compiler.options.output.path,
        ignore: this.options.ignore || [],
        copyUnmodified: this.options.copyUnmodified,
        concurrency: this.options.concurrency,
      };

      if (
        globalRef.output === '/' &&
        compiler.options.devServer &&
        compiler.options.devServer.outputPath
      ) {
        globalRef.output = compiler.options.devServer.outputPath;
      }

      const tasks = [];

      this.patterns.forEach((pattern) => {
        tasks.push(
          Promise.resolve()
            .then(() => preProcessPattern(globalRef, pattern))
            // Every source (from) is assumed to exist here
            // eslint-disable-next-line no-shadow
            .then((pattern) => processPattern(globalRef, pattern))
        );
      });

      Promise.all(tasks)
        .catch((err) => {
          compilation.errors.push(err);
        })
        .then(() => callback());
    };

    const afterEmit = (compilation, cb) => {
      debug('starting after-emit');

      const callback = () => {
        debug('finishing after-emit');
        cb();
      };

      let compilationFileDependencies;
      let addFileDependency;

      if (Array.isArray(compilation.fileDependencies)) {
        compilationFileDependencies = new Set(compilation.fileDependencies);
        addFileDependency = (file) => compilation.fileDependencies.push(file);
      } else {
        compilationFileDependencies = compilation.fileDependencies;
        addFileDependency = (file) => compilation.fileDependencies.add(file);
      }

      let compilationContextDependencies;
      let addContextDependency;

      if (Array.isArray(compilation.contextDependencies)) {
        compilationContextDependencies = new Set(
          compilation.contextDependencies
        );
        addContextDependency = (file) =>
          compilation.contextDependencies.push(file);
      } else {
        compilationContextDependencies = compilation.contextDependencies;
        addContextDependency = (file) =>
          compilation.contextDependencies.add(file);
      }

      // Add file dependencies if they're not already tracked
      for (const fileDependency of fileDependencies) {
        if (compilationFileDependencies.has(fileDependency)) {
          debug(
            `not adding ${fileDependency} to change tracking, because it's already tracked`
          );
        } else {
          debug(`adding ${fileDependency} to change tracking`);

          addFileDependency(fileDependency);
        }
      }

      // Add context dependencies if they're not already tracked
      for (const contextDependency of contextDependencies) {
        if (compilationContextDependencies.has(contextDependency)) {
          debug(
            `not adding ${contextDependency} to change tracking, because it's already tracked`
          );
        } else {
          debug(`adding ${contextDependency} to change tracking`);

          addContextDependency(contextDependency);
        }
      }

      callback();
    };

    const plugin = { name: 'CopyPlugin' };

    compiler.hooks.emit.tapAsync(plugin, emit);
    compiler.hooks.afterEmit.tapAsync(plugin, afterEmit);
  }
}

export default CopyPlugin;
