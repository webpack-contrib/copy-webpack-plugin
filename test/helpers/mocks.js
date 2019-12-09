import path from 'path';

import CachedInputFileSystem from 'enhanced-resolve/lib/CachedInputFileSystem';
import NodeJsInputFileSystem from 'enhanced-resolve/lib/NodeJsInputFileSystem';

const BUILD_DIR = path.join(__dirname, '../build');
const FIXTURES_DIR = path.join(__dirname, '../fixtures');

class MockCompiler {
  constructor(options = {}) {
    this.options = {
      context: FIXTURES_DIR,
      output: {
        path: options.outputPath || BUILD_DIR,
      },
    };

    if (options.devServer && options.devServer.outputPath) {
      this.options.devServer = {
        outputPath: options.devServer.outputPath,
      };
    }

    this.inputFileSystem = new CachedInputFileSystem(
      new NodeJsInputFileSystem(),
      0
    );

    this.hooks = {
      emit: {
        tapAsync: (plugin, fn) => {
          this.hooks.emit = fn;
        },
      },
      afterEmit: {
        tapAsync: (plugin, fn) => {
          this.hooks.afterEmit = fn;
        },
      },
    };

    this.outputFileSystem = {
      constructor: {
        name: 'NotMemoryFileSystem',
      },
    };
  }
}

class MockCompilerNoStat extends MockCompiler {
  constructor(options = {}) {
    super(options);

    // eslint-disable-next-line no-undefined
    this.inputFileSystem.stat = (file, cb) => cb(undefined, undefined);
  }
}

export { MockCompiler, MockCompilerNoStat };
