## Copy Webpack Plugin

This is a [webpack](http://webpack.github.io/) plugin that copies individual files or entire directories to the build directory.

### Getting started

Install the plugin:

```
npm install --save-dev copy-webpack-plugin
```

### Usage

`new CopyWebpackPlugin([patterns])`

A pattern looks like:
`{ from: 'source', to: 'dest' }`

Pattern params:
* `from`
    - is required
    - can be an absolute or relative path
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

### Examples

```javascript
var CopyWebpackPlugin = require('copy-webpack-plugin');

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
        ])
    ]
};
```

### Testing

[![Build Status](https://drone.io/github.com/kevlened/copy-webpack-plugin/status.png)](https://drone.io/github.com/kevlened/copy-webpack-plugin/latest)

Run `npm test`

### License

MIT