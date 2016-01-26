## 1.1.1 (Jan 25, 2016)

 * `to` absolute paths are now tracked by webpack
 * Reverted dot matching default for minimatch
 * Params can now be passed to the `ignore` option


## 1.0.0 (Jan 24, 2016)

 * Added globbing support for `from`
 * Added absolute path support for `to`
 * Changed default for minimatch to match dots for globs


## 0.3.0 (Nov 27, 2015)

* Added `ignore` option that functions like `.gitignore`
* Improved Windows support


## 0.2.0 (Oct 28, 2015)

* Added `force` option in patterns to overwrite prestaged assets
* Files and directories are now added to webpack's rebuild watchlist
* Only includes changed files while using webpack --watch


## 0.1.0 (Oct 26, 2015)

* Basic functionality