## Copy Webpack Plugin

This is a [webpack](http://webpack.github.io/) plugin that copies individual files or entire directories to the build directory.

### Getting started

Install the plugin:

```
npm install --save-dev copy-webpack-plugin
```

### Usage

```javascript
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.join(__dirname, 'app'),
    plugins: [
        new CopyWebpackPlugin([
            // File examples
            { from: 'path/to/file.txt' },
            { from: 'path/to/file.txt', to: 'path/to/build/file.txt' },
            { from: 'path/to/file.txt', to: 'path/to/build/directory' },
            { from: 'path/to/file.txt', to: 'file/without/extension', toType: 'file' },
            { from: 'path/to/file.txt', to: 'directory/with/extension.ext', toType: 'dir' },

            // Directory examples
            { from: 'path/to/directory' },
            { from: 'path/to/directory', to: 'path/to/build/directory' }
        ])
    ]
};
```

### Common patterns

*   Copy from file to file. The destination file can be renamed.

        { from: 'path/to/file.txt', to: 'path/to/build/file.txt' }

*   Copy from file to directory

        { from: 'path/to/file.txt', to: 'path/to/build/directory' }

*   Copy from directory to directory. The destination directory can be renamed.

        { from: 'path/to/directory', to: 'path/to/build/directory' }

### Special cases

*   Copy from file to root

        { from: 'path/to/file.txt' }

*   Copy from directory to root

        { from: 'path/to/directory' }

*   Copy from file to directory that has an extension. If the `to` parameter has an extension, the plugin assumes the target is a file. Provide `toType` to override this behavior.

        { from: 'path/to/file.txt', to: 'directory/with/extension.ext', toType: 'dir' }

*   Copy from file to file without an extension. If the `to` parameter doesn't have an extension, the plugin assumes the target is a directory. Provide `toType` to override this behavior.

        { from: 'path/to/file.txt', to: 'file/without/extension', toType: 'file' }

*   Overwrite existing file. By default, assets that are staged by previous plugins aren't overwritten. Provide `force` to override this behavior.

        { from: 'path/to/file.txt', force: true }
        { from: 'path/to/directory', force: true }

### Testing

Run `mocha`

### License

MIT