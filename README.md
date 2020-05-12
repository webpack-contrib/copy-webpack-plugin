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

Copies individual files or entire directories, which already exist, to the build directory.

## Getting Started

To begin, you'll need to install `copy-webpack-plugin`:

```console
$ npm install copy-webpack-plugin --save-dev
```

Then add the plugin to your `webpack` config. For example:

**webpack.config.js**

```js
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'source', to: 'dest' },
        { from: 'other', to: 'public' },
      ],
    }),
  ],
};
```

> ℹ️ `webpack-copy-plugin` is not designed to copy files generated from the build process; rather, it is to copy files that already exist in the source tree, as part of the build process.

> ℹ️ If you want `webpack-dev-server` to write files to the output directory during development, you can force it with the [`writeToDisk`](https://github.com/webpack/webpack-dev-middleware#writetodisk) option or the [`write-file-webpack-plugin`](https://github.com/gajus/write-file-webpack-plugin).

## Options

The plugin's signature:

**webpack.config.js**

```js
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'source', to: 'dest' },
        { from: 'other', to: 'public' },
      ],
      options: {
        ignore: ['*.bin'],
      },
    }),
  ],
};
```

### Patterns

|                Name                 |        Type         |                     Default                     | Description                                                                                           |
| :---------------------------------: | :-----------------: | :---------------------------------------------: | :---------------------------------------------------------------------------------------------------- |
|           [`from`](#from)           |     `{String}`      |                   `undefined`                   | Glob or path from where we сopy files.                                                                |
|             [`to`](#to)             |     `{String}`      |            `compiler.options.output`            | Output path.                                                                                          |
|        [`context`](#context)        |     `{String}`      | `options.context \|\| compiler.options.context` | A path that determines how to interpret the `from` path.                                              |
|    [`globOptions`](#globoptions)    |     `{Object}`      |                   `undefined`                   | [Options][glob-options] passed to the glob pattern matching library, including `ignore` option        |
|         [`toType`](#totype)         |     `{String}`      |                   `undefined`                   | Determinate what is `to` option - directory, file or template.                                        |
|           [`test`](#test)           | `{String\|RegExp}`  |                   `undefined`                   | Pattern for extracting elements to be used in `to` templates.                                         |
|          [`force`](#force)          |     `{Boolean}`     |                     `false`                     | Overwrites files already in `compilation.assets` (usually added by other plugins/loaders).            |
|        [`flatten`](#flatten)        |     `{Boolean}`     |                     `false`                     | Removes all directory references and only copies file names.                                          |
|      [`transform`](#transform)      |    `{Function}`     |                   `undefined`                   | Allows to modify the file contents.                                                                   |
| [`cacheTransform`](#cacheTransform) | `{Boolean\|Object}` |                     `false`                     | Enable `transform` caching. You can use `{ cache: { key: 'my-cache-key' } }` to invalidate the cache. |
|  [`transformPath`](#transformpath)  |    `{Function}`     |                   `undefined`                   | Allows to modify the writing path.                                                                    |

#### `from`

Type: `String`
Default: `undefined`

Glob or path from where we сopy files.
Globs accept [fast-glob pattern-syntax](https://github.com/mrmlnc/fast-glob#pattern-syntax).
Glob can only be a `string`.

> ⚠️ Don't use directly `\\` in `from` (i.e `path\to\file.ext`) option because on UNIX the backslash is a valid character inside a path component, i.e., it's not a separator.
> On Windows, the forward slash and the backward slash are both separators.
> Instead please use `/` or `path` methods.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        'relative/path/to/file.ext',
        '/absolute/path/to/file.ext',
        'relative/path/to/dir',
        '/absolute/path/to/dir',
        '**/*',
        {
          from: '**/*',
        },
      ],
    }),
  ],
};
```

##### `For windows`

If you define `from` as file path or folder path on `Windows`, you can use windows path segment (`\\`)

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('__dirname', 'file.txt'),
        },
      ],
    }),
  ],
};
```

But you should always use forward-slashes in `glob` expressions
See [fast-glob manual](https://github.com/mrmlnc/fast-glob#how-to-write-patterns-on-windows).

```js
const FIXTURES_DIR_NORMALIZED = path
  .resolve(__dirname, 'fixtures')
  .replace(/\\/g, '/');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.posix.join(FIXTURES_DIR_NORMALIZED, 'file.txt'),
        },
      ],
    }),
  ],
};
```

##### `For exclude files`

To exclude files from the selection, you should use [globOptions.ignore option](https://github.com/mrmlnc/fast-glob#ignore)

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '**/*',
          globOptions: {
            ignore: ['**/file.*', '**/ignored-directory/**'],
          },
        },
      ],
    }),
  ],
};
```

#### `to`

Type: `String`
Default: `compiler.options.output`

Output path.

> ⚠️ Don't use directly `\\` in `to` (i.e `path\to\dest`) option because on UNIX the backslash is a valid character inside a path component, i.e., it's not a separator.
> On Windows, the forward slash and the backward slash are both separators.
> Instead please use `/` or `path` methods.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '**/*',
          to: 'relative/path/to/dest/',
        },
        {
          from: '**/*',
          to: '/absolute/path/to/dest/',
        },
        {
          from: '**/*',
          to: '[path][name].[contenthash].[ext]',
        },
      ],
    }),
  ],
};
```

#### `context`

Type: `String`
Default: `options.context|compiler.options.context`

A path that determines how to interpret the `from` path.

> ⚠️ Don't use directly `\\` in `context` (i.e `path\to\context`) option because on UNIX the backslash is a valid character inside a path component, i.e., it's not a separator.
> On Windows, the forward slash and the backward slash are both separators.
> Instead please use `/` or `path` methods.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/*.txt',
          to: 'dest/',
          context: 'app/',
        },
      ],
    }),
  ],
};
```

#### `globOptions`

Type: `Object`
Default: `undefined`

Allows to configute the glob pattern matching library used by the plugin. [See the list of supported options][glob-options]

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'public/**/*',
          globOptions: {
            dot: true,
            gitignore: true,
          },
        },
      ],
    }),
  ],
};
```

#### `toType`

Type: `String`
Default: `undefined`

Determinate what is `to` option - directory, file or template.
Sometimes it is hard to say what is `to`, example `path/to/dir-with.ext`.
If you want to copy files in directory you need use `dir` option.
We try to automatically determine the `type` so you most likely do not need this option.

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
    new CopyPlugin({
      patterns: [
        {
          from: 'path/to/file.txt',
          to: 'directory/with/extension.ext',
          toType: 'dir',
        },
      ],
    }),
  ],
};
```

##### `'file'`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'path/to/file.txt',
          to: 'file/without/extension',
          toType: 'file',
        },
      ],
    }),
  ],
};
```

##### `'template'`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/',
          to: 'dest/[name].[hash].[ext]',
          toType: 'template',
        },
      ],
    }),
  ],
};
```

#### `test`

Type: `string|RegExp`
Default: `undefined`

Pattern for extracting elements to be used in `to` templates.

Defines a `{RegExp}` to match some parts of the file path.
These capture groups can be reused in the name property using `[N]` placeholder.
Note that `[0]` will be replaced by the entire path of the file,
whereas `[1]` will contain the first capturing parenthesis of your `{RegExp}`
and so on...

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '*/*',
          to: '[1]-[2].[hash].[ext]',
          test: /([^/]+)\/(.+)\.png$/,
        },
      ],
    }),
  ],
};
```

#### `force`

Type: `Boolean`
Default: `false`

Overwrites files already in `compilation.assets` (usually added by other plugins/loaders).

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/**/*',
          to: 'dest/',
          force: true,
        },
      ],
    }),
  ],
};
```

#### `flatten`

Type: `Boolean`
Default: `false`

Removes all directory references and only copies file names.

> ⚠️ If files have the same name, the result is non-deterministic.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/**/*',
          to: 'dest/',
          flatten: true,
        },
      ],
    }),
  ],
};
```

#### `transform`

Type: `Function`
Default: `undefined`

Allows to modify the file contents.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/*.png',
          to: 'dest/',
          transform(content, path) {
            return optimize(content);
          },
        },
      ],
    }),
  ],
};
```

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/*.png',
          to: 'dest/',
          transform(content, path) {
            return Promise.resolve(optimize(content));
          },
        },
      ],
    }),
  ],
};
```

#### `cacheTransform`

Type: `Boolean|Object`
Default: `false`

Enable/disable `transform` caching. You can use `{ cacheTransform: { key: 'my-cache-key' } }` to invalidate the cache.
Default path to cache directory: `node_modules/.cache/copy-webpack-plugin`.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/*.png',
          to: 'dest/',
          transform(content, path) {
            return optimize(content);
          },
          cacheTransform: true,
        },
      ],
    }),
  ],
};
```

#### `transformPath`

Type: `Function`
Default: `undefined`

Allows to modify the writing path.

> ⚠️ Don't return directly `\\` in `transformPath` (i.e `path\to\newFile`) option because on UNIX the backslash is a valid character inside a path component, i.e., it's not a separator.
> On Windows, the forward slash and the backward slash are both separators.
> Instead please use `/` or `path` methods.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/*.png',
          to: 'dest/',
          transformPath(targetPath, absolutePath) {
            return 'newPath';
          },
        },
      ],
    }),
  ],
};
```

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/*.png',
          to: 'dest/',
          transformPath(targetPath, absolutePath) {
            return Promise.resolve('newPath');
          },
        },
      ],
    }),
  ],
};
```

#### `ignore`

Array of globs to ignore (applied to `from`).

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [...patterns],
      options: { ignore: ['*.js', '*.css'] },
    }),
  ],
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
[tests]: https://github.com/webpack-contrib/copy-webpack-plugin/workflows/copy-webpack-plugin/badge.svg
[tests-url]: https://github.com/webpack-contrib/copy-webpack-plugin/actions
[cover]: https://codecov.io/gh/webpack-contrib/copy-webpack-plugin/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/copy-webpack-plugin
[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack
[size]: https://packagephobia.now.sh/badge?p=copy-webpack-plugin
[size-url]: https://packagephobia.now.sh/result?p=copy-webpack-plugin
[glob-options]: https://github.com/sindresorhus/globby#options
