import path from 'path';

import CachedInputFileSystem from 'enhanced-resolve/lib/CachedInputFileSystem';
import NodeJsInputFileSystem from 'enhanced-resolve/lib/NodeJsInputFileSystem';

const { Logger } = require('webpack/lib/logging/Logger');

const BUILD_DIR = path.join(__dirname, '../build');
const FIXTURES_DIR = path.join(__dirname, '../fixtures');

const getInfrastructureLogger = (name) => {
  if (!name) {
    throw new TypeError(
      'Compiler.getInfrastructureLogger(name) called without a name'
    );
  }
  return new Logger(
    // eslint-disable-next-line no-unused-vars
    (type, args) => {
      if (typeof name === 'function') {
        name = name();
        if (!name) {
          throw new TypeError(
            'Compiler.getInfrastructureLogger(name) called with a function not returning a name'
          );
        }
      }
    },
    (childName) => {
      if (typeof name === 'function') {
        if (typeof childName === 'function') {
          return this.getInfrastructureLogger(() => {
            if (typeof name === 'function') {
              name = name();
              if (!name) {
                throw new TypeError(
                  'Compiler.getInfrastructureLogger(name) called with a function not returning a name'
                );
              }
            }
            if (typeof childName === 'function') {
              childName = childName();
              if (!childName) {
                throw new TypeError(
                  'Logger.getChildLogger(name) called with a function not returning a name'
                );
              }
            }
            return `${name}/${childName}`;
          });
        }
        return this.getInfrastructureLogger(() => {
          if (typeof name === 'function') {
            name = name();
            if (!name) {
              throw new TypeError(
                'Compiler.getInfrastructureLogger(name) called with a function not returning a name'
              );
            }
          }
          return `${name}/${childName}`;
        });
      }
      if (typeof childName === 'function') {
        return this.getInfrastructureLogger(() => {
          if (typeof childName === 'function') {
            childName = childName();
            if (!childName) {
              throw new TypeError(
                'Logger.getChildLogger(name) called with a function not returning a name'
              );
            }
          }
          return `${name}/${childName}`;
        });
      }
      return this.getInfrastructureLogger(`${name}/${childName}`);
    }
  );
};

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
    this.getInfrastructureLogger = getInfrastructureLogger;
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
