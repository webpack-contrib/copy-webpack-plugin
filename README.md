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

#### Pattern properties:
* `from`
    - is required
    - can be an absolute or path relative to the context
    - can be a file or directory
    - can be a glob
* `to`
    - is optional
    - if not absolute, it's relative to the build root
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

#### Available options:
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
                { glob: '**/*', dot: true }
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