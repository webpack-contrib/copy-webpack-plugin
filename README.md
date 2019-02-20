<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![chat][chat]][chat-url]
[![size][size]][size-url]

# copy-webpack-plugin

Copies individual files or entire directories to the build directory.

## Getting Started

To begin, you'll need to install `copy-webpack-plugin`:

```console
$ npm install copy-webpack-plugin --save-dev
```

Then add the loader to your `webpack` config. For example:

**webpack.config.js**

```js
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin([
      { from: 'source', to: 'dest' },
      { from: 'other', to: 'public' },
    ]),
  ],
};
```

> ℹ️ If you want `webpack-dev-server` to write files to the output directory during development, you can force it with the [`writeToDisk`](https://github.com/webpack/webpack-dev-middleware#writetodisk) option or the [`write-file-webpack-plugin`](https://github.com/gajus/write-file-webpack-plugin).

## Options

The plugin's signature:

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin(patterns, options)],
};
```

### Patterns

|               Name                |         Type          |                     Default                     | Description                                                                                                                                                                      |
| :-------------------------------: | :-------------------: | :---------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|          [`from`](#from)          |  `{String\|Object}`   |                   `undefined`                   | Globs accept [minimatch options](https://github.com/isaacs/minimatch). See the [`node-glob` options](https://github.com/isaacs/node-glob#options) in addition to the ones below. |
|            [`to`](#to)            |  `{String\|Object}`   |                   `undefined`                   | Output root if `from` is file or dir, resolved glob path if `from` is glob.                                                                                                      |
|        [`toType`](#toType)        |      `{String}`       |                   `undefined`                   | `[toType Options](#totype)`.                                                                                                                                                     |
|          [`test`](#test)          |      `{RegExp}`       |                   `undefined`                   | Pattern for extracting elements to be used in `to` templates.                                                                                                                    |
|         [`force`](#force)         |      `{Boolean}`      |                     `false`                     | Overwrites files already in `compilation.assets` (usually added by other plugins/loaders).                                                                                       |
|        [`ignore`](#ignore)        |       `{Array}`       |                      `[]`                       | Globs to ignore for this pattern.                                                                                                                                                |
|       [`flatten`](#flatten)       |      `{Boolean}`      |                     `false`                     | Removes all directory references and only copies file names.⚠️ If files have the same name, the result is non-deterministic.                                                     |
|     [`transform`](#transform)     | `{Function\|Promise}` |          `(content, path) => content`           | Function or Promise that modifies file contents before copying.                                                                                                                  |
| [`transformPath`](#transformPath) | `{Function\|Promise}` |       `(targetPath, sourcePath) => path`        | Function or Promise that modifies file writing path.                                                                                                                             |
|         [`cache`](#cache)         |  `{Boolean\|Object}`  |                     `false`                     | Enable `transform` caching. You can use `{ cache: { key: 'my-cache-key' } }` to invalidate the cache.                                                                            |
|       [`context`](#context)       |      `{String}`       | `options.context \|\| compiler.options.context` | A path that determines how to interpret the `from` path.                                                                                                                         |

#### `from`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      'relative/path/to/file.ext',
      '/absolute/path/to/file.ext',
      'relative/path/to/dir',
      '/absolute/path/to/dir',
      '**/*',
      { glob: '**/*', dot: false },
    ]),
  ],
};
```

#### `to`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      { from: '**/*', to: 'relative/path/to/dest/' },
      { from: '**/*', to: '/absolute/path/to/dest/' },
    ]),
  ],
};
```

#### `toType`

|       Name       |    Type    |   Default   | Description                                                                                        |
| :--------------: | :--------: | :---------: | :------------------------------------------------------------------------------------------------- |
|   **`'dir'`**    | `{String}` | `undefined` | If `from` is directory, `to` has no extension or ends in `'/'`                                     |
|   **`'file'`**   | `{String}` | `undefined` | If `to` has extension or `from` is file                                                            |
| **`'template'`** | `{String}` | `undefined` | If `to` contains [a template pattern](https://github.com/webpack-contrib/file-loader#placeholders) |

##### `'dir'`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'path/to/file.txt',
        to: 'directory/with/extension.ext',
        toType: 'dir',
      },
    ]),
  ],
};
```

##### `'file'`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'path/to/file.txt',
        to: 'file/without/extension',
        toType: 'file',
      },
    ]),
  ],
};
```

##### `'template'`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/',
        to: 'dest/[name].[hash].[ext]',
        toType: 'template',
      },
    ]),
  ],
};
```

#### `test`

Defines a `{RegExp}` to match some parts of the file path.
These capture groups can be reused in the name property using `[N]` placeholder.
Note that `[0]` will be replaced by the entire path of the file,
whereas `[1]` will contain the first capturing parenthesis of your `{RegExp}`
and so on...

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: '*/*',
        to: '[1]-[2].[hash].[ext]',
        test: /([^/]+)\/(.+)\.png$/,
      },
    ]),
  ],
};
```

#### `force`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/**/*',
        to: 'dest/',
        force: true,
      },
    ]),
  ],
};
```

#### `ignore`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/**/*',
        to: 'dest/',
        ignore: ['*.js'],
      },
    ]),
  ],
};
```

#### `flatten`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/**/*',
        to: 'dest/',
        flatten: true,
      },
    ]),
  ],
};
```

#### `transform`

##### `{Function}`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/*.png',
        to: 'dest/',
        transform(content, path) {
          return optimize(content);
        },
      },
    ]),
  ],
};
```

##### `{Promise}`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/*.png',
        to: 'dest/',
        transform(content, path) {
          return Promise.resolve(optimize(content));
        },
      },
    ]),
  ],
};
```

#### `transformPath`

##### `{Function}`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/*.png',
        to: 'dest/',
        transformPath(targetPath, absolutePath) {
          return 'newPath';
        },
      },
    ]),
  ],
};
```

##### `{Promise}`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/*.png',
        to: 'dest/',
        transformPath(targePath, absolutePath) {
          return Promise.resolve('newPath');
        },
      },
    ]),
  ],
};
```

#### `cache`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/*.png',
        to: 'dest/',
        transform(content, path) {
          return optimize(content);
        },
        cache: true,
      },
    ]),
  ],
};
```

#### `context`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin([
      {
        from: 'src/*.txt',
        to: 'dest/',
        context: 'app/',
      },
    ]),
  ],
};
```

### Options

|                Name                 |    Type     |          Default           | Description                                                                                                                                       |
| :---------------------------------: | :---------: | :------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------ |
|       [`logLevel`](#logLevel)       | `{String}`  |      **`'warning'`**       | Level of messages that the module will log                                                                                                        |
|         [`ignore`](#ignore)         |  `{Array}`  |            `[]`            | Array of globs to ignore (applied to `from`)                                                                                                      |
|        [`context`](#context)        | `{String}`  | `compiler.options.context` | A path that determines how to interpret the `from` path, shared for all patterns                                                                  |
| [`copyUnmodified`](#copyUnmodified) | `{Boolean}` |          `false`           | Copies files, regardless of modification when using watch or `webpack-dev-server`. All files are copied on first build, regardless of this option |

#### `logLevel`

This property defines the level of messages that the module will log. Valid levels include:

- `trace`
- `debug`
- `info`
- `warn`
- `error`
- `silent`

Setting a log level means that all other levels below it will be visible in the
console. Setting `logLevel: 'silent'` will hide all console output. The module
leverages [`webpack-log`](https://github.com/webpack-contrib/webpack-log#readme)
for logging management, and more information can be found on its page.

##### `'info'`

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin([...patterns], { debug: 'info' })],
};
```

##### `'debug'`

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin([...patterns], { debug: 'debug' })],
};
```

##### `'warning' (default)`

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin([...patterns], { debug: true })],
};
```

#### `ignore`

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin([...patterns], { ignore: ['*.js', '*.css'] })],
};
```

#### `context`

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin([...patterns], { context: '/app' })],
};
```

#### `copyUnmodified`

> ℹ️ By default, we only copy **modified** files during a `webpack --watch` or `webpack-dev-server` build. Setting this option to `true` will copy all files.

**webpack.config.js**

```js
module.exports = {
  plugins: [new CopyPlugin([...patterns], { copyUnmodified: true })],
};
```

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

[CONTRIBUTING](./.github/CONTRIBUTING.md)

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/copy-webpack-plugin.svg
[npm-url]: https://npmjs.com/package/copy-webpack-plugin
[node]: https://img.shields.io/node/v/copy-webpack-plugin.svg
[node-url]: https://nodejs.org
[deps]: https://david-dm.org/webpack-contrib/copy-webpack-plugin.svg
[deps-url]: https://david-dm.org/webpack-contrib/copy-webpack-plugin
[tests]: https://secure.travis-ci.org/webpack-contrib/copy-webpack-plugin.svg
[tests-url]: http://travis-ci.org/webpack-contrib/copy-webpack-plugin
[cover]: https://codecov.io/gh/webpack-contrib/copy-webpack-plugin/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/copy-webpack-plugin
[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack
[size]: https://packagephobia.now.sh/badge?p=copy-webpack-plugin
[size-url]: https://packagephobia.now.sh/result?p=copy-webpack-plugin
