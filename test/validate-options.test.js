import CopyPlugin from '../src/index';

// Todo remove after dorp node@6 support
if (!Object.entries) {
  Object.entries = function entries(obj) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);

    // eslint-disable-next-line no-plusplus
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }

    return resArray;
  };
}

describe('validate options', () => {
  const tests = {
    patterns: {
      success: [
        [],
        ['test.txt'],
        ['test.txt', 'test-other.txt'],
        [
          'test.txt',
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
          },
        ],
        [
          {
            from: 'test.txt',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
          },
        ],
        [
          {
            from: 'test.txt',
            context: 'context',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            toType: 'file',
            test: /test/,
            force: true,
            ignore: [
              'ignore-1',
              'ignore-2',
              {
                dot: false,
                glob: '**/*',
              },
            ],
            flatten: true,
            cache: true,
            transform: () => {},
            transformPath: () => {},
          },
        ],
        [
          {
            from: {
              glob: '**/*',
              dot: false,
            },
            to: 'dir',
            context: 'context',
            globOptions: {
              dot: false,
            },
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            globOptions: {
              dot: false,
            },
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            test: 'test',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            test: /test/,
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            cache: {
              foo: 'bar',
            },
          },
        ],
      ],
      failure: [
        true,
        'true',
        '',
        {},
        [''],
        [{}],
        [
          {
            from: '',
            to: 'dir',
            context: 'context',
          },
        ],
        [
          {
            from: true,
            to: 'dir',
            context: 'context',
          },
        ],
        [
          {
            from: 'test.txt',
            to: true,
            context: 'context',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: true,
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            toType: 'foo',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            test: true,
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            force: 'true',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            ignore: true,
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            ignore: [true],
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            ignore: ['test.txt', true],
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            flatten: 'true',
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            cache: () => {},
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            transform: true,
          },
        ],
        [
          {
            from: 'test.txt',
            to: 'dir',
            context: 'context',
            transformPath: true,
          },
        ],
      ],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === 'object' && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === 'success' ? 'successfully validate' : 'throw an error on'
    } the "${key}" option with "${stringifyValue(value)}" value`, async () => {
      let error;

      try {
        // eslint-disable-next-line no-new
        new CopyPlugin(key === 'patterns' ? value : { [key]: value });
      } catch (errorFromPlugin) {
        if (errorFromPlugin.name !== 'ValidationError') {
          throw errorFromPlugin;
        }

        error = errorFromPlugin;
      } finally {
        if (type === 'success') {
          expect(error).toBeUndefined();
        } else if (type === 'failure') {
          expect(() => {
            throw error;
          }).toThrowErrorMatchingSnapshot();
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
