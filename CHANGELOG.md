# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [10.2.4](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v10.2.3...v10.2.4) (2022-01-31)


### Bug Fixes

* types ([#666](https://github.com/webpack-contrib/copy-webpack-plugin/issues/666)) ([a1c2308](https://github.com/webpack-contrib/copy-webpack-plugin/commit/a1c2308511a4cccb92a22cb395b6eb66dc1c776b))

### [10.2.3](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v10.2.2...v10.2.3) (2022-01-29)


### Bug Fixes

* async `to` support ([fd095fb](https://github.com/webpack-contrib/copy-webpack-plugin/commit/fd095fb79399df5edbd06d9dbd1ed30fe4f7eb24))

### [10.2.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v10.2.1...v10.2.2) (2022-01-28)


### Bug Fixes

* types ([#664](https://github.com/webpack-contrib/copy-webpack-plugin/issues/664)) ([f58470e](https://github.com/webpack-contrib/copy-webpack-plugin/commit/f58470ee1275330046b0867f70bcd3f2378a2a25))

### [10.2.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v10.2.0...v10.2.1) (2022-01-20)


### Bug Fixes

* types ([#661](https://github.com/webpack-contrib/copy-webpack-plugin/issues/661)) ([324aecb](https://github.com/webpack-contrib/copy-webpack-plugin/commit/324aecb42ebd5594dcd1a607522cbbf1c512baff))

## [10.2.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v10.1.0...v10.2.0) (2021-12-16)


### Features

* removed cjs wrapper and generated types in commonjs format (`export =` and `namespaces` used in types), now you can directly use exported types ([#654](https://github.com/webpack-contrib/copy-webpack-plugin/issues/654)) ([5901006](https://github.com/webpack-contrib/copy-webpack-plugin/commit/590100688f66b9a7591f1f46a02de0cc6967032c))

## [10.1.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v10.0.0...v10.1.0) (2021-12-10)


### Features

* added types ([#650](https://github.com/webpack-contrib/copy-webpack-plugin/issues/650)) ([1aa5b2d](https://github.com/webpack-contrib/copy-webpack-plugin/commit/1aa5b2d2dd1b913f68d6eccebb29bca09d96f11b))


### Bug Fixes

* expand lint-staged ([#649](https://github.com/webpack-contrib/copy-webpack-plugin/issues/649)) ([f8aad69](https://github.com/webpack-contrib/copy-webpack-plugin/commit/f8aad69ac4296caf2319d355e844db50e1e30d4d))

## [10.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v9.1.0...v10.0.0) (2021-11-17)


### ⚠ BREAKING CHANGES

* minimum supported `Node.js` version is `12.20.0`
* update `globby` to `12.0.2` version

## [9.1.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v9.0.1...v9.1.0) (2021-11-11)


### Features

* output helpful descriptions and links on errors ([#625](https://github.com/webpack-contrib/copy-webpack-plugin/issues/625)) ([396bed6](https://github.com/webpack-contrib/copy-webpack-plugin/commit/396bed6a8ad12cea344e988fefb9a554bb9c7b1a))


### Bug Fixes

* compatibility with Node.js 17 ([20af0c7](https://github.com/webpack-contrib/copy-webpack-plugin/commit/20af0c7f1b06a7e597e6b498dbc2b432a4a6d0de))

### [9.0.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v9.0.0...v9.0.1) (2021-06-25)

### Chore

* update `serialize-javascript`

## [9.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v8.1.1...v9.0.0) (2021-05-21)


### ⚠ BREAKING CHANGES

* minimum supported `Node.js` version is `12.13.0`

### [8.1.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v8.1.0...v8.1.1) (2021-04-06)


### Bug Fixes

* `stage` for processing assets  ([#600](https://github.com/webpack-contrib/copy-webpack-plugin/issues/600)) ([#601](https://github.com/webpack-contrib/copy-webpack-plugin/issues/601)) ([d8fa32a](https://github.com/webpack-contrib/copy-webpack-plugin/commit/d8fa32ac1a9e3d42c6257ac7aab6c43cc1bed791))

## [8.1.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v8.0.0...v8.1.0) (2021-03-22)


### Features

* added the `transformAll` option ([#596](https://github.com/webpack-contrib/copy-webpack-plugin/issues/596)) ([dde71f0](https://github.com/webpack-contrib/copy-webpack-plugin/commit/dde71f01417b9291c7029a3876e043d76beb9e8d))

## [8.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v7.0.0...v8.0.0) (2021-03-04)


### ⚠ BREAKING CHANGES

* logic for some placeholders was changed:
    - `[hash]` and `[fullhash]` works as in webpack (i.e. it is `hash` of build, not content hash of file), to migrate change `[name].[hash].[ext]` to `[name].[contenthash][ext]`
    - `[ext]` doesn't require `.` (dot) before, i.e. change `[name].[ext]` to `[name][ext]`
    - `[<hashType>:contenthash:<digestType>:<length>]` and `[<hashType>:hash:<digestType>:<length>]` is not supported anymore, you can use `output.hashDigest`, `output.hashDigestLength` and `output.hashFunction` options to setup it
    - `[N]` was removed in favor of using the `to` option as a function
    - `[folder]` was removed
    - `[emoji]` was removed

### Features

* added `priority` option ([#590](https://github.com/webpack-contrib/copy-webpack-plugin/issues/590)) ([ea610bc](https://github.com/webpack-contrib/copy-webpack-plugin/commit/ea610bc1a0fa7097f291b0928fb28eb96b0f03af))

## [7.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.4.0...v7.0.0) (2020-12-10)


### ⚠ BREAKING CHANGES

* minimum supported webpack version is `5`
* the `flatten` option was removed in favor `[name].[ext]` value for the `to` option, 
* the `transformPath` option was removed in favor `Function` type of the `to` option, look at [examples](https://github.com/webpack-contrib/copy-webpack-plugin#function)
* the `cacheTransform` option was removed in favor `Object` type of the `transform` option, look at [examples](https://github.com/webpack-contrib/copy-webpack-plugin#transform)
* migration on the `compilation.hooks.processAssets` hook
* empty filtered paths throw an error, you can disable this behaviour using the `noErrorOnMissing` option

## [6.4.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.3.2...v6.4.0) (2020-12-07)


### Features

* added the `info` option ([db53937](https://github.com/webpack-contrib/copy-webpack-plugin/commit/db53937016b7dbf494bc728f00242cd26541f6a3))
* added type `Function` for the `to` option ([#563](https://github.com/webpack-contrib/copy-webpack-plugin/issues/563)) ([9bc5416](https://github.com/webpack-contrib/copy-webpack-plugin/commit/9bc541694c0d0975c59586cedfea4a51d11f5278))

### [6.3.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.3.1...v6.3.2) (2020-11-19)


### Bug Fixes

* watching directories ([#558](https://github.com/webpack-contrib/copy-webpack-plugin/issues/558)) ([7b58fd9](https://github.com/webpack-contrib/copy-webpack-plugin/commit/7b58fd9a89e9b29578b30cb3119453e78e036ec2))

### [6.3.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.3.0...v6.3.1) (2020-11-13)


### Bug Fixes

* watching ([#555](https://github.com/webpack-contrib/copy-webpack-plugin/issues/555)) ([b996923](https://github.com/webpack-contrib/copy-webpack-plugin/commit/b9969230321df68ed235ed1861729837f234750e))

## [6.3.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.2.1...v6.3.0) (2020-11-03)


### Features

* added the `sourceFilename` info (original source filename) to assets info ([#542](https://github.com/webpack-contrib/copy-webpack-plugin/issues/542)) ([db2e3bf](https://github.com/webpack-contrib/copy-webpack-plugin/commit/db2e3bfae9322592c3a9af1e45d25df165b6b4e0))
* persistent cache between compilations (webpack@5 only) ([#541](https://github.com/webpack-contrib/copy-webpack-plugin/issues/541)) ([c892451](https://github.com/webpack-contrib/copy-webpack-plugin/commit/c8924512a34391ce92715a2b61fc4b0b91a9e10f))

### [6.2.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.2.0...v6.2.1) (2020-10-09)

### Chore

* update `schema-utils`

## [6.2.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.1.1...v6.2.0) (2020-10-02)


### Features

* use webpack input filesystem (only webpack@5) ([#531](https://github.com/webpack-contrib/copy-webpack-plugin/issues/531)) ([6f2f455](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6f2f455b9411ac69ef6aa3b953474f1d7fa23808))

### [6.1.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.1.0...v6.1.1) (2020-09-18)

### Chore

* updated `serialize-javascript` 

## [6.1.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.0.4...v6.1.0) (2020-08-31)


### Features

* added `filter` option ([#524](https://github.com/webpack-contrib/copy-webpack-plugin/issues/524)) ([1496f85](https://github.com/webpack-contrib/copy-webpack-plugin/commit/1496f85d2fa5e87dccd0cda92b1343c649f3e5bd))
* added the `copied` flag to asset info ([09b1dc9](https://github.com/webpack-contrib/copy-webpack-plugin/commit/09b1dc995e476bb7090ebb2c2cbd4b5ebedeaa79))
* added the `immutable` flag to asset info with hash in name ([#525](https://github.com/webpack-contrib/copy-webpack-plugin/issues/525)) ([a1989d5](https://github.com/webpack-contrib/copy-webpack-plugin/commit/a1989d59b8b0a8caf0b826016e20c82a9ac38aa1))
* **webpack@5:** improve stats output for `copied` files

### [6.0.4](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.0.3...v6.0.4) (2020-08-29)


### Bug Fixes

* compatibility with webpack@5 ([#522](https://github.com/webpack-contrib/copy-webpack-plugin/issues/522)) ([714af2f](https://github.com/webpack-contrib/copy-webpack-plugin/commit/714af2ff72da168ec7456ac9a93ef4f4486be21e))

### [6.0.3](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.0.2...v6.0.3) (2020-06-30)


### Bug Fixes

* do not execute on a child compiler ([42f27c7](https://github.com/webpack-contrib/copy-webpack-plugin/commit/42f27c777cc37dc2ce4af399cb2a943e9e62172e))

### [6.0.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.0.1...v6.0.2) (2020-06-03)


### Bug Fixes

* security problem
* compatibility with `10.13` version of Node.js

### [6.0.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v6.0.0...v6.0.1) (2020-05-16)


### Bug Fixes

* concurrency writing assets ([#484](https://github.com/webpack-contrib/copy-webpack-plugin/issues/484)) ([bfc712d](https://github.com/webpack-contrib/copy-webpack-plugin/commit/bfc712d77b4ba66caf72341e31a1dd5957bfa36c))
* escaping special characters in the `context` option ([0e62695](https://github.com/webpack-contrib/copy-webpack-plugin/commit/0e62695ee32216a133920f2ab5a1282e6a4a038b))

## [6.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.1.1...v6.0.0) (2020-05-15)


### ⚠ BREAKING CHANGES

* minimum supported Node.js version is `10.13`, 
* the plugin now accepts an object, you should change `new CopyPlugin(patterns, options)` to `new CopyPlugin({ patterns, options })`
* migrate on `compilation.additionalAssets` hook
* the `ignore` option (which accepted [micromatch](https://github.com/micromatch/micromatch) syntax) was removed in favor `globOptions.ignore` (which accepts [fast-glob pattern-syntax](https://github.com/mrmlnc/fast-glob#pattern-syntax))
* the `test` option was removed in favor the `transformPath` option
* the `cache` option was renamed to the `cacheTransform` option, `cacheTransform` option should have only `directory` and `keys` properties when it is an object
* global `context` and `ignore` options were removed in favor `patten.context` and `pattern.globOptions.ignore` options
* the missing file error is now an error, before it was a warning
* the `from` option now can only be a string, if you use `{ from: { glob: 'directory/**', dot: false } }` changed it to `{ from: 'directory/**', globOptions: { dot: false } }`
* the `copyUnmodified` was removed without replacements
* the `2` version of `webpack-dev-server` is not supported anymore
* the `logLevel` was removed in favor the `infrastructureLogging.level` option, please read the [documentation](https://webpack.js.org/configuration/other-options/#infrastructurelogginglevel)


### Features

* implement the `concurrency` option ([#466](https://github.com/webpack-contrib/copy-webpack-plugin/issues/466)) ([c176d7d](https://github.com/webpack-contrib/copy-webpack-plugin/commit/c176d7d124cf3c5ad372576d4b0f7fbf5e1d0afc))
* implement the `directory` option for the `cacheTransform` option ([29254e3](https://github.com/webpack-contrib/copy-webpack-plugin/commit/29254e394cb695d89b477f44f3a3bf8c99c74ca7))
* implement the `noErrorOnMissing` option ([#475](https://github.com/webpack-contrib/copy-webpack-plugin/issues/475)) ([e3803ce](https://github.com/webpack-contrib/copy-webpack-plugin/commit/e3803ceffe93361184efc9b799be4c9dfb4eb467))
* migrate on webpack built-in logger ([#446](https://github.com/webpack-contrib/copy-webpack-plugin/issues/446)) ([5af02bc](https://github.com/webpack-contrib/copy-webpack-plugin/commit/5af02bcfc716b6bca96b569740a45221a974ae61))


### Bug Fixes

* asset size ([197b0d8](https://github.com/webpack-contrib/copy-webpack-plugin/commit/197b0d8d08e6ce976f645dade7641cfdcfc0781d))
* persist assets between rebuilds ([57f3e61](https://github.com/webpack-contrib/copy-webpack-plugin/commit/57f3e618108c3a6c1f61f21186d69433ee51a561))

### [5.1.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.1.0...v5.1.1) (2019-12-12)


### Bug Fixes

* allow to setup empty array ([#425](https://github.com/webpack-contrib/copy-webpack-plugin/issues/425)) ([3b79595](https://github.com/webpack-contrib/copy-webpack-plugin/commit/3b79595d6ef3527a26588112ad17e3c54e264d5c))

## [5.1.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.0.5...v5.1.0) (2019-12-09)


### Features

* validate options ([#419](https://github.com/webpack-contrib/copy-webpack-plugin/issues/419)) ([452539a](https://github.com/webpack-contrib/copy-webpack-plugin/commit/452539ad6498583901536e89204d6004a618cb4a))


### Bug Fixes

* better to determine when glob is used ([4826e56](https://github.com/webpack-contrib/copy-webpack-plugin/commit/4826e56c9c034113eadd86b46a97ed1254bf3252))

### [5.0.5](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.0.4...v5.0.5) (2019-11-06)


### Performance Improvements

* improvements for webpack@5



### [5.0.4](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.0.3...v5.0.4) (2019-07-26)


### Bug Fixes

* use posix separator for emitting assets ([#392](https://github.com/webpack-contrib/copy-webpack-plugin/issues/392)) ([7f08be6](https://github.com/webpack-contrib/copy-webpack-plugin/commit/7f08be6))



<a name="5.0.3"></a>
## [5.0.3](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.0.2...v5.0.3) (2019-04-24)


### Bug Fixes

* alone `[N]` interpolation in `to` option ([#375](https://github.com/webpack-contrib/copy-webpack-plugin/issues/375)) ([70917b7](https://github.com/webpack-contrib/copy-webpack-plugin/commit/70917b7))



<a name="5.0.2"></a>
## [5.0.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v5.0.1...v5.0.2) (2019-03-22)


### Bug Fixes

* add fallback to transform cache directory ([#361](https://github.com/webpack-contrib/copy-webpack-plugin/issues/361)) ([05963eb](https://github.com/webpack-contrib/copy-webpack-plugin/commit/05963eb))
* better determinate template in `to` option ([#363](https://github.com/webpack-contrib/copy-webpack-plugin/issues/363)) ([52f8be6](https://github.com/webpack-contrib/copy-webpack-plugin/commit/52f8be6))
* emit errors instead throw ([#362](https://github.com/webpack-contrib/copy-webpack-plugin/issues/362)) ([3946473](https://github.com/webpack-contrib/copy-webpack-plugin/commit/3946473))
* watch on windows ([#359](https://github.com/webpack-contrib/copy-webpack-plugin/issues/359)) ([eaf4306](https://github.com/webpack-contrib/copy-webpack-plugin/commit/eaf4306))


### Performance Improvements

* avoid extra call `stat` for file ([#365](https://github.com/webpack-contrib/copy-webpack-plugin/issues/365)) ([ae2258f](https://github.com/webpack-contrib/copy-webpack-plugin/commit/ae2258f))



<a name="5.0.1"></a>
## [5.0.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.6.0...v5.0.1) (2019-03-11)


### Bug Fixes

* respect base of `glob` for context dependencies ([#352](https://github.com/webpack-contrib/copy-webpack-plugin/issues/352)) ([5b407f1](https://github.com/webpack-contrib/copy-webpack-plugin/commit/5b407f1))


<a name="5.0.0"></a>
# [5.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.6.0...v5.0.0) (2019-02-20)


### Bug Fixes

* copy only modified files when you use patterns with difference `to` and same `context` ([#341](https://github.com/webpack-contrib/copy-webpack-plugin/issues/341)) ([e808aa2](https://github.com/webpack-contrib/copy-webpack-plugin/commit/e808aa2))
* handle `[contenthash]` as template ([#328](https://github.com/webpack-contrib/copy-webpack-plugin/issues/328)) ([61dfe52](https://github.com/webpack-contrib/copy-webpack-plugin/commit/61dfe52))
* handles when you add new files in watch mode and use `glob` ([#333](https://github.com/webpack-contrib/copy-webpack-plugin/issues/333)) ([49a28f0](https://github.com/webpack-contrib/copy-webpack-plugin/commit/49a28f0))
* normalize path segment separation, no problems when you mixed `/` and `\\` ([#339](https://github.com/webpack-contrib/copy-webpack-plugin/issues/339)) ([8f5e638](https://github.com/webpack-contrib/copy-webpack-plugin/commit/8f5e638))
* throw error if `from` is an empty string [#278](https://github.com/webpack-contrib/copy-webpack-plugin/issues/278) ([#285](https://github.com/webpack-contrib/copy-webpack-plugin/issues/285)) ([adf1046](https://github.com/webpack-contrib/copy-webpack-plugin/commit/adf1046))


### Features

* emit warning instead error if file doesn't exist ([#338](https://github.com/webpack-contrib/copy-webpack-plugin/issues/338)) ([a1c5372](https://github.com/webpack-contrib/copy-webpack-plugin/commit/a1c5372))
* supports copy nested directories/files in symlink ([#335](https://github.com/webpack-contrib/copy-webpack-plugin/issues/335)) ([f551c0d](https://github.com/webpack-contrib/copy-webpack-plugin/commit/f551c0d))


### BREAKING CHANGES

* drop support for webpack < 4
* drop support for node < 6.9
* `debug` option was renamed to `logLevel`, it only accepts string values: `trace`, `debug`, `info`, `warn`, `error` and `silent`
* plugin emit warning instead error if file doesn't exist
* change `prototype` of plugin, now you can to get correct plugin name



<a name="4.6.0"></a>
# [4.6.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.5.4...v4.6.0) (2018-10-31)


### Bug Fixes

* handle undefined and null as stats value ([#302](https://github.com/webpack-contrib/copy-webpack-plugin/issues/302)) ([78c5d12](https://github.com/webpack-contrib/copy-webpack-plugin/commit/78c5d12))


### Features

* add support for target path transform ([#284](https://github.com/webpack-contrib/copy-webpack-plugin/issues/284)) ([7fe0c06](https://github.com/webpack-contrib/copy-webpack-plugin/commit/7fe0c06))



<a name="4.5.4"></a>
## [4.5.4](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.5.3...v4.5.4) (2018-10-18)


### Bug Fixes

* **processPattern:** don't add `'glob'` as directory when it is a file (`contextDependencies`) ([#296](https://github.com/webpack-contrib/copy-webpack-plugin/issues/296)) ([5670926](https://github.com/webpack-contrib/copy-webpack-plugin/commit/5670926))



<a name="4.5.3"></a>
## [4.5.3](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.5.2...v4.5.3) (2018-10-10)


### Bug Fixes

* **processPattern:** add `glob` directory context to `contextDependencies` ([#290](https://github.com/webpack-contrib/copy-webpack-plugin/issues/290)) ([5fa69db](https://github.com/webpack-contrib/copy-webpack-plugin/commit/5fa69db))



<a name="4.5.2"></a>
## [4.5.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.5.1...v4.5.2) (2018-06-26)


### Bug Fixes

* allow square brackets in path ([#264](https://github.com/webpack-contrib/copy-webpack-plugin/issues/264)) ([3ef5b6c](https://github.com/webpack-contrib/copy-webpack-plugin/commit/3ef5b6c)), closes [#231](https://github.com/webpack-contrib/copy-webpack-plugin/issues/231)



<a name="4.5.1"></a>
## [4.5.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.5.0...v4.5.1) (2018-03-09)


### Bug Fixes

* **package:** update `cacache` v10.0.1...10.0.4 (`dependencies`) ([#238](https://github.com/webpack-contrib/copy-webpack-plugin/issues/238)) ([0b288f9](https://github.com/webpack-contrib/copy-webpack-plugin/commit/0b288f9))


### Performance Improvements

* **index:** switch to `md4` for content hashing ([#239](https://github.com/webpack-contrib/copy-webpack-plugin/issues/239)) ([2be8191](https://github.com/webpack-contrib/copy-webpack-plugin/commit/2be8191))



<a name="4.5.0"></a>
# [4.5.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.4.3...v4.5.0) (2018-03-02)


### Features

* **processPattern:** add support for `{RegExp)` matches (`pattern.test`) ([#235](https://github.com/webpack-contrib/copy-webpack-plugin/issues/235)) ([1861730](https://github.com/webpack-contrib/copy-webpack-plugin/commit/1861730))



<a name="4.4.3"></a>
## [4.4.3](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.4.2...v4.4.3) (2018-03-01)


### Bug Fixes

* **index:** `tapable` deprecation warnings (`webpack >= v4.0.0`) ([#234](https://github.com/webpack-contrib/copy-webpack-plugin/issues/234)) ([445d548](https://github.com/webpack-contrib/copy-webpack-plugin/commit/445d548))



<a name="4.4.2"></a>
## [4.4.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.4.1...v4.4.2) (2018-02-23)


### Bug Fixes

* **src/:** don't escape non-glob patterns ([#230](https://github.com/webpack-contrib/copy-webpack-plugin/issues/230)) ([0eb2cd5](https://github.com/webpack-contrib/copy-webpack-plugin/commit/0eb2cd5))



<a name="4.4.1"></a>
## [4.4.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.4.0...v4.4.1) (2018-02-08)


### Bug Fixes

* replace `pify` with simpler promise helpers ([#221](https://github.com/webpack-contrib/copy-webpack-plugin/issues/221)) ([dadac24](https://github.com/webpack-contrib/copy-webpack-plugin/commit/dadac24))



<a name="4.4.0"></a>
# [4.4.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.3.1...v4.4.0) (2018-02-08)


### Bug Fixes

* **package:** add `prepare` script ([9bf0d99](https://github.com/webpack-contrib/copy-webpack-plugin/commit/9bf0d99))
* **preProcessPatterns:** support glob context paths with special characters ([#208](https://github.com/webpack-contrib/copy-webpack-plugin/issues/208)) ([ea0c05f](https://github.com/webpack-contrib/copy-webpack-plugin/commit/ea0c05f))
* support `webpack >= v4.0.0` ([6a16b3c](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6a16b3c))


### Features

* use `compiler.inputFileSystem` instead `fs` ([#205](https://github.com/webpack-contrib/copy-webpack-plugin/issues/205)) ([158f821](https://github.com/webpack-contrib/copy-webpack-plugin/commit/158f821))



<a name="4.3.1"></a>
## [4.3.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.3.0...v4.3.1) (2017-12-22)


### Bug Fixes

* `cache` behaviour ([#196](https://github.com/webpack-contrib/copy-webpack-plugin/issues/196)) ([6beb89e](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6beb89e))
* `cache` option behaviour ([3b088d0](https://github.com/webpack-contrib/copy-webpack-plugin/commit/3b088d0))



<a name="4.3.0"></a>
# [4.3.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.2.4...v4.3.0) (2017-12-14)


### Features

* add option to cache `pattern.transform` (`pattern.cache`) ([#176](https://github.com/webpack-contrib/copy-webpack-plugin/issues/176)) ([20c143b](https://github.com/webpack-contrib/copy-webpack-plugin/commit/20c143b))
* option for caching `transform` function ([48c19ff](https://github.com/webpack-contrib/copy-webpack-plugin/commit/48c19ff))



<a name="4.2.4"></a>
## [4.2.4](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.2.3...v4.2.4) (2017-12-14)


### Refactoring

* refactor: use native `{Promise}` instead of `bluebird` ([#178](https://github.com/webpack-contrib/copy-webpack-plugin/issues/178)) ([a508f14](https://github.com/webpack-contrib/copy-webpack-plugin/commit/a508f14))



<a name="4.2.3"></a>
## [4.2.3](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.2.2...v4.2.3) (2017-11-23)



<a name="4.2.2"></a>
## [4.2.2](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.2.0...v4.2.2) (2017-11-23)


### Bug Fixes

* copying same file to multiple targets ([#165](https://github.com/webpack-contrib/copy-webpack-plugin/issues/165)) ([43a9870](https://github.com/webpack-contrib/copy-webpack-plugin/commit/43a9870))



<a name="4.2.0"></a>
# [4.2.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.1.1...v4.2.0) (2017-10-19)


### Features

* add `context` option (`options.context`) ([#149](https://github.com/webpack-contrib/copy-webpack-plugin/issues/149)) ([10cd1a2](https://github.com/webpack-contrib/copy-webpack-plugin/commit/10cd1a2))
* allow async transforms ([#111](https://github.com/webpack-contrib/copy-webpack-plugin/issues/111)) ([8794e5f](https://github.com/webpack-contrib/copy-webpack-plugin/commit/8794e5f))
* Plugin context option ([5c54e92](https://github.com/webpack-contrib/copy-webpack-plugin/commit/5c54e92)), closes [#148](https://github.com/webpack-contrib/copy-webpack-plugin/issues/148)
* support `{String}` patterns ([#155](https://github.com/webpack-contrib/copy-webpack-plugin/issues/155)) ([b6c2e66](https://github.com/webpack-contrib/copy-webpack-plugin/commit/b6c2e66))
* Support simple string patterns ([056a60b](https://github.com/webpack-contrib/copy-webpack-plugin/commit/056a60b)), closes [#150](https://github.com/webpack-contrib/copy-webpack-plugin/issues/150)



<a name="4.1.1"></a>
## [4.1.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.1.0...v4.1.1) (2017-10-05)


### Chore

* Update dependencies for NSP security advisory ([#151](https://github.com/webpack-contrib/copy-webpack-plugin/issues/151)) ([6d4346e](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6d4346e))

  - Reference issue: https://nodesecurity.io/advisories/minimatch_regular-expression-denial-of-service



<a name="4.1.0"></a>
# [4.1.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v2.1.3...v4.1.0) (2017-09-29)


### Bug Fixes

* Changed default ignore glob to ignore dot files ([#80](https://github.com/webpack-contrib/copy-webpack-plugin/issues/80)) ([08b69a4](https://github.com/webpack-contrib/copy-webpack-plugin/commit/08b69a4))
* Fixed glob as object ([1b2c21a](https://github.com/webpack-contrib/copy-webpack-plugin/commit/1b2c21a))
* Improved Windows compatibility ([#85](https://github.com/webpack-contrib/copy-webpack-plugin/issues/85)) ([ad62899](https://github.com/webpack-contrib/copy-webpack-plugin/commit/ad62899))
* Memory leak in watch mode and use Set for performance ([#130](https://github.com/webpack-contrib/copy-webpack-plugin/issues/130)) ([de46fde](https://github.com/webpack-contrib/copy-webpack-plugin/commit/de46fde))
* subdirectory errors in blob patterns ([c2720d0](https://github.com/webpack-contrib/copy-webpack-plugin/commit/c2720d0))


### Features

* Added non-wildcard glob support ([405d1ec](https://github.com/webpack-contrib/copy-webpack-plugin/commit/405d1ec))
* Added transform method to patterns ([#77](https://github.com/webpack-contrib/copy-webpack-plugin/issues/77)) ([6371eb1](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6371eb1))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v2.1.3...v4.0.1) (2017-09-29)


### Bug Fixes

* Fixed glob as object ([1b2c21a](https://github.com/webpack-contrib/copy-webpack-plugin/commit/1b2c21a))
* Improved Windows compatibility ([#85](https://github.com/webpack-contrib/copy-webpack-plugin/issues/85)) ([ad62899](https://github.com/webpack-contrib/copy-webpack-plugin/commit/ad62899))
* subdirectory errors in blob patterns ([c2720d0](https://github.com/webpack-contrib/copy-webpack-plugin/commit/c2720d0))


### Features

* Added non-wildcard glob support ([405d1ec](https://github.com/webpack-contrib/copy-webpack-plugin/commit/405d1ec))
* Added transform method to patterns ([#77](https://github.com/webpack-contrib/copy-webpack-plugin/issues/77)) ([6371eb1](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6371eb1))



<a name="4.0.0"></a>
## [4.0.0](https://github.com/webpack-contrib/copy-webpack-plugin/compare/v4.0.0...v3.0.1) (2016-10-23)


### Bug Fixes

* Changed default ignore glob to ignore dot files ([#80](https://github.com/webpack-contrib/copy-webpack-plugin/issues/80)) ([08b69a4](https://github.com/webpack-contrib/copy-webpack-plugin/commit/08b69a4))

### Features

* Added transform method to patterns ([6371eb1](https://github.com/webpack-contrib/copy-webpack-plugin/commit/6371eb1))
