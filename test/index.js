var expect = require('chai').expect;
var CopyWebpackPlugin = require('../index');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));


var HELPER_DIR = path.join(__dirname, 'helpers');

function MockCompiler() {
	this.options = {
		context: HELPER_DIR
	};
}

MockCompiler.prototype.plugin = function(type, fn) {
	switch(type) {
		case 'emit':
			this.emitFn = fn;
			break;
		case 'after-emit':
			this.afterEmitFn = fn;
			break;
	}
};

describe('apply function', function() {

	// Ideally we pass in patterns and confirm the resulting assets
	function run(opts) {
		return new Promise(function(resolve, reject) {
			var plugin = new CopyWebpackPlugin(opts.patterns);

			// Get a mock compiler to pass to plugin.apply
			var compiler = opts.compiler || new MockCompiler();
			plugin.apply(compiler);

			// Call the registered function with a mock compilation and callback
			var compilation = _.extend({
				errors: [],
				assets: {},
				fileDependencies: [],
				contextDependencies: []
			}, opts.compilation);

			// Execute the functions in series
			Promise.each([compiler.emitFn, compiler.afterEmitFn], function(fn) {
				return new Promise(function(res, rej) {
					try {
						fn(compilation, res);
					} catch(e) {
						rej(e);
					}
				});
			})
			.then(function() {
				if (compilation.errors.length > 0) {
					throw compilation.errors[0];
				}
				resolve(compilation);
			})
			.catch(reject);
		});
	}

	function runEmit(opts) {
		return run(opts)
		.then(function(compilation) {
			if (opts.expectedAssetKeys && opts.expectedAssetKeys.length > 0) {
				expect(compilation.assets).to.have.all.keys(opts.expectedAssetKeys);
			} else {
				expect(compilation.assets).to.be.empty;
			}
		});
	}

	function runForce(opts) {
		opts.compilation = {
			assets: {}
		};
		opts.compilation.assets[opts.existingAsset] = {
			source: function() {
				return 'existing';
			}
		};
		return run(opts)
		.then(function(compilation) {
			var assetContent = compilation.assets[opts.existingAsset].source().toString();
			expect(assetContent).to.equal(opts.expectedAssetContent);
		});
	}

	function runChange(opts) {
		// Create two test files
		fs.writeFileSync(opts.newFileLoc1);
		fs.writeFileSync(opts.newFileLoc2);

		// Create a reference to the compiler
		var compiler = new MockCompiler();
		var compilation = {
			errors: [],
			assets: {},
			fileDependencies: [],
			contextDependencies: []
		};
		return run({
			compiler: compiler,
			patterns: opts.patterns
		})
		// mtime is only measured in whole seconds
		.delay(1000)
		.then(function() {

			// Change a file
			fs.appendFileSync(opts.newFileLoc1, 'extra');

			// Trigger another compile
			return new Promise(function(res, rej) {
				compiler.emitFn(compilation, res);
			});
		})
		.then(function() {
			return compilation;
		})
		.finally(function() {
			fs.unlinkSync(opts.newFileLoc1);
			fs.unlinkSync(opts.newFileLoc2);
		});
	}

	describe('error handling', function() {
		it('doesn\'t throw an error if no patterns are passed', function(done) {
			runEmit({
				patterns: undefined,
				expectedAssetKeys: []
			})
			.then(done)
			.catch(done);
		});

		it('throws an error if the patterns are an object', function() {
			var createPluginWithObject = function() {
				new CopyWebpackPlugin({});
			};
			expect(createPluginWithObject).to.throw(Error);
		});

		it('throws an error if the patterns are null', function() {
			var createPluginWithNull = function() {
				new CopyWebpackPlugin(null);
			};
			expect(createPluginWithNull).to.throw(Error);
		});
	});

	describe('with file in from', function() {
		it('can move a file to the root directory', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt' }],
				expectedAssetKeys: ['file.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a file to a new directory without a forward slash', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt', to: 'newdirectory' }],
				expectedAssetKeys: ['newdirectory/file.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a file to a new directory with a forward slash', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt', to: 'newdirectory/' }],
				expectedAssetKeys: ['newdirectory/file.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a file to a new directory with an extension', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt', to: 'newdirectory.ext', toType: 'dir' }],
				expectedAssetKeys: ['newdirectory.ext/file.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a file to a new directory with an extension and forward slash', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt', to: 'newdirectory.ext/' }],
				expectedAssetKeys: ['newdirectory.ext/file.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a file to a new file with a different name', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt', to: 'newname.txt' }],
				expectedAssetKeys: ['newname.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a file to a new file with no extension', function(done) {
			runEmit({
				patterns: [{ from: 'file.txt', to: 'newname', toType: 'file' }],
				expectedAssetKeys: ['newname']
			})
			.then(done)
			.catch(done);
		});

		it('can move a nested file to the root directory', function(done) {
			runEmit({
				patterns: [{ from: 'directory/directoryfile.txt' }],
				expectedAssetKeys: ['directoryfile.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a nested file to a new directory', function(done) {
			runEmit({
				patterns: [{ from: 'directory/directoryfile.txt', to: 'newdirectory' }],
				expectedAssetKeys: ['newdirectory/directoryfile.txt']
			})
			.then(done)
			.catch(done);
		});

		it('won\'t overwrite a file already in the compilation', function(done) {
			runForce({
				patterns: [{ from: 'file.txt' }],
				existingAsset: 'file.txt',
				expectedAssetContent: 'existing'
			})
			.then(done)
			.catch(done);
		});

		it('can force overwrite of a file already in the compilation', function(done) {
			runForce({
				patterns: [{ from: 'file.txt', force: true }],
				existingAsset: 'file.txt',
				expectedAssetContent: 'new'
			})
			.then(done)
			.catch(done);
		});

		it('adds the file to the watch list', function(done) {
			run({
				patterns: [{ from: 'file.txt' }]
			})
			.then(function(compilation) {
				var absFrom = path.join(HELPER_DIR, 'file.txt');
				expect(compilation.fileDependencies).to.have.members([absFrom]);
			})
			.then(done)
			.catch(done);
		});

		it('only include files that have changed', function(done) {
			runChange({
				patterns: [{ from: 'tempfile1.txt' }, { from: 'tempfile2.txt' }],
				newFileLoc1: path.join(HELPER_DIR, 'tempfile1.txt'),
				newFileLoc2: path.join(HELPER_DIR, 'tempfile2.txt')
			})
			.then(function(compilation) {
				expect(compilation.assets).to.have.key('tempfile1.txt');
				expect(compilation.assets).not.to.have.key('tempfile2.txt');
			})
			.then(done)
			.catch(done);
		});
	});

	describe('with directory in from', function() {
		it('can move a directory\'s contents to the root directory', function(done) {
			runEmit({
				patterns: [{ from: 'directory' }],
				expectedAssetKeys: ['directoryfile.txt', 'nested/nestedfile.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a directory\'s contents to a new directory', function(done) {
			runEmit({
				patterns: [{ from: 'directory', to: 'newdirectory' }],
				expectedAssetKeys: ['newdirectory/directoryfile.txt','newdirectory/nested/nestedfile.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a nested directory\'s contents to the root directory', function(done) {
			runEmit({
				patterns: [{ from: 'directory/nested' }],
				expectedAssetKeys: ['nestedfile.txt']
			})
			.then(done)
			.catch(done);
		});

		it('can move a nested directory\'s contents to a new directory', function(done) {
			runEmit({
				patterns: [{ from: 'directory/nested', to: 'newdirectory' }],
				expectedAssetKeys: ['newdirectory/nestedfile.txt']
			})
			.then(done)
			.catch(done);
		});

		it('won\'t overwrite a file already in the compilation', function(done) {
			runForce({
				patterns: [{ from: 'directory' }],
				existingAsset: 'directoryfile.txt',
				expectedAssetContent: 'existing'
			})
			.then(done)
			.catch(done);
		});

		it('can force overwrite of a file already in the compilation', function(done) {
			runForce({
				patterns: [{ from: 'directory', force: true }],
				existingAsset: 'directoryfile.txt',
				expectedAssetContent: 'new'
			})
			.then(done)
			.catch(done);
		});

		it('adds the directory to the watch list', function(done) {
			run({
				patterns: [{ from: 'directory' }]
			})
			.then(function(compilation) {
				var absFrom = path.join(HELPER_DIR, 'directory');
				expect(compilation.contextDependencies).to.have.members([absFrom]);
			})
			.then(done)
			.catch(done);
		});

		it('only include files that have changed', function(done) {
			runChange({
				patterns: [{ from: 'directory' }],
				newFileLoc1: path.join(HELPER_DIR, 'directory', 'tempfile1.txt'),
				newFileLoc2: path.join(HELPER_DIR, 'directory', 'tempfile2.txt')
			})
			.then(function(compilation) {
				expect(compilation.assets).to.have.key('tempfile1.txt');
				expect(compilation.assets).not.to.have.key('tempfile2.txt');
			})
			.then(done)
			.catch(done);
		});
	});
});