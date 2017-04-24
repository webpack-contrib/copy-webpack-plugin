## Copy Webpack Plugin Advanced

This is a [webpack](http://webpack.github.io/) plugin that copies individual files or entire directories to the build directory.

> This package is fork of the original [copy-webpack-plugin](https://github.com/kevlened/copy-webpack-plugin) with additional functionality.
Reason for creating this separate npm package due to unresponsiveness of original author to [pull request](https://github.com/kevlened/copy-webpack-plugin/pull/103). 

### Getting started

Install the plugin:

```
npm install --save-dev copy-webpack-plugin
```

### Usage

`new CopyWebpackPlugin([patterns], options)`

A pattern looks like:
`{ from: 'source', to: 'dest' }`

#### Pattern properties:

| Name | Required | Default     | Details                                                 |
|------|----------|------------ |---------------------------------------------------------|
| `from` | Y        |             | _examples:_<br>'relative/file.txt'<br>'/absolute/file.txt'<br>'relative/dir'<br>'/absolute/dir'<br>'\*\*/\*'<br>{glob:'\*\*/\*', dot: true}<br><br>Globs accept [minimatch options](https://github.com/isaacs/minimatch) |
| `to`   | N        | output root if `from` is file or dir<br><br>resolved glob path if `from` is glob | _examples:_<br>'relative/file.txt'<br>'/absolute/file.txt'<br>'relative/dir'<br>'/absolute/dir'<br>'relative/[name].[ext]'<br>'/absolute/[name].[ext]'<br><br>Templates are [file-loader patterns](https://github.com/webpack/file-loader) |
| `toType` | N | **'file'** if `to` has extension or `from` is file<br><br>**'dir'** if `from` is directory, `to` has no extension or ends in '/'<br><br>**'template'** if `to` contains [a template pattern](https://github.com/webpack/file-loader) | |
| `context` | N | compiler.options.context | A path that determines how to interpret the `from` path |
| `flatten` | N | false | Removes all directory references and only copies file names<br><br>If files have the same name, the result is non-deterministic |
| `ignore` | N | [] | Additional globs to ignore for this pattern |
| `transform` | N | function(content, absolutePath, relativePath) {<br>&nbsp;&nbsp;return content;<br>} | Function that modifies file contents before writing to webpack |
| `merge` | N | function(content1, content2) {<br>&nbsp;&nbsp;return content;<br>} | Function that merges content to the content already in compilation (e.g. when paths overlap). Cannot be used with `force`. |
| `force` | N | false | Overwrites files already in compilation.assets (usually added by other plugins). Cannot be used with `merge` |

#### Available options:

| Name | Default | Details |
| ---- | ------- | ------- |
| `ignore` | [] | Array of globs to ignore (applied to `from`) |
| `copyUnmodified` | false | Copies files, regardless of modification when using watch or webpack-dev-server. All files are copied on first build, regardless of this option. |
| `debug` | **'warning'** | _options:_<br>**'warning'** - only warnings<br>**'info'** or true - file location and read info<br>**'debug'** - very detailed debugging info

### Examples

```javascript
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    context: path.join(__dirname, 'app'),
    devServer: {
        // This is required for older versions of webpack-dev-server
        // if you use absolute 'to' paths. The path should be an
        // absolute path to your build destination.
        outputPath: path.join(__dirname, 'build')
    },
    plugins: [
        new CopyWebpackPlugin([
            // {output}/file.txt
            { from: 'from/file.txt' },

            // {output}/to/file.txt
            { from: 'from/file.txt', to: 'to/file.txt' },

            // {output}/to/directory/file.txt
            { from: 'from/file.txt', to: 'to/directory' },

            // Copy directory contents to {output}/
            { from: 'from/directory' },

            // Copy directory contents to {output}/to/directory/
            { from: 'from/directory', to: 'to/directory' },

            // Copy glob results to /absolute/path/
            { from: 'from/directory/**/*', to: '/absolute/path' },

            // Copy glob results (with dot files) to /absolute/path/
            {
                from: {
                    glob:'from/directory/**/*',
                    dot: true
                },
                to: '/absolute/path'
            },

            // Copy glob results, relative to context
            {
                context: 'from/directory',
                from: '**/*',
                to: '/absolute/path'
            },

            // {output}/file/without/extension
            {
                from: 'path/to/file.txt',
                to: 'file/without/extension',
                toType: 'file'
            },

            // {output}/directory/with/extension.ext/file.txt
            {
                from: 'path/to/file.txt',
                to: 'directory/with/extension.ext',
                toType: 'dir'
            }
        ], {
            ignore: [
                // Doesn't copy any files with a txt extension
                '*.txt',

                // Doesn't copy any file, even if they start with a dot
                '**/*',

                // Doesn't copy any file, except if they start with a dot
                { glob: '**/*', dot: false }
            ],

            // By default, we only copy modified files during
            // a watch or webpack-dev-server build. Setting this
            // to `true` copies all files.
            copyUnmodified: true
        })
    ]
};
```

### Testing

[![Build Status](https://travis-ci.org/kevlened/copy-webpack-plugin.svg?branch=master)](https://travis-ci.org/kevlened/copy-webpack-plugin)

Run `npm test`

### FAQ

#### "EMFILE: too many open files" or "ENFILE: file table overflow"

Globally patch fs with [graceful-fs](https://www.npmjs.com/package/graceful-fs)

`npm install graceful-fs --save-dev`

At the top of your webpack config, insert this

    var fs = require('fs');
    var gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(fs);

See [this issue](https://github.com/kevlened/copy-webpack-plugin/issues/59#issuecomment-228563990) for more details

#### This doesn't copy my files with webpack-dev-server

Starting in version [3.0.0](https://github.com/kevlened/copy-webpack-plugin/blob/master/CHANGELOG.md#300-may-14-2016), we stopped using fs to copy files to the filesystem and started depending on webpack's [in-memory filesystem](https://webpack.github.io/docs/webpack-dev-server.html#content-base):

> ... webpack-dev-server will serve the static files in your build folder. It’ll watch your source files for changes and when changes are made the bundle will be recompiled. **This modified bundle is served from memory at the relative path specified in publicPath (see API)**. It will not be written to your configured output directory.

If you must have webpack-dev-server write to your output directory, you can force it with the [write-file-webpack-plugin](https://github.com/gajus/write-file-webpack-plugin).

### License

MIT
