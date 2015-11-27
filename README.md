## Copy Webpack Plugin

This is a [webpack](http://webpack.github.io/) plugin that copies individual files or entire directories to the build directory.

### Getting started

Install the plugin:

```
npm install --save-dev copy-webpack-plugin
```

### Usage

`new CopyWebpackPlugin([patterns], options)`

A pattern looks like:
`{ from: 'source', to: 'dest' }`

Pattern properties:
* `from`
    - is required
    - can be an absolute or path relative to the context
    - can be a file or directory
* `to`
    - is optional
    - is relative to the context root
    - defaults to `'/'`
    - must be a directory if `from` is a directory
* `toType`
    - is optional
    - is ignored if `from` is a directory
    - defaults to `'file'` if `to` has an extension
    - defaults to `'dir'` if `to` doesn't have an extension
* `force`
    - is optional
    - defaults to `false`
    - forces the plugin to overwrite files staged by previous plugins

Available options:
* `ignore`
    - an array of files and directories to ignore
    - accepts globs
    - globs are evaluated on the `from` path, relative to the context

### Examples

```javascript
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    context: path.join(__dirname, 'app'),
    plugins: [
        new CopyWebpackPlugin([
            // {context}/file.txt
            { from: 'path/to/file.txt' },
            
            // {context}/path/to/build/file.txt
            { from: 'path/to/file.txt', to: 'path/to/build/file.txt' },
            
            // {context}/path/to/build/directory/file.txt
            { from: 'path/to/file.txt', to: 'path/to/build/directory' },

            // Copy directory contents to {context}/
            { from: 'path/to/directory' },
            
            // Copy directory contents to {context}/path/to/build/directory
            { from: 'path/to/directory', to: 'path/to/build/directory' },
            
            // {context}/file/without/extension
            {
                from: 'path/to/file.txt',
                to: 'file/without/extension',
                toType: 'file'
            },
            
            // {context}/directory/with/extension.ext/file.txt
            {
                from: 'path/to/file.txt',
                to: 'directory/with/extension.ext',
                toType: 'dir'
            }
        ], {
            ignore: [
                // Doesn't copy any files with a txt extension    
                '*.txt'
            ]
        })
    ]
};
```

### Testing

[![Build Status](https://drone.io/github.com/kevlened/copy-webpack-plugin/status.png)](https://drone.io/github.com/kevlened/copy-webpack-plugin/latest)

Run `npm test`

### License

MIT