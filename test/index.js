var expect = require('chai').expect;
var CopyWebpackPlugin = require('../index');
var path = require('path');

function MockCompiler() {
	this.options = {
		context: path.join(__dirname, 'helpers')
	};
}

MockCompiler.prototype.plugin = function(type, fn) {
	this.emitFn = fn;
};

describe('apply function', function() {

	// Ideally we pass in patterns and confirm the resulting assets
	function run(patterns, expectedAssetKeys, done) {
		var plugin = new CopyWebpackPlugin(patterns);

		// Get a mock compiler to pass to plugin.apply
		var compiler = new MockCompiler();
		plugin.apply(compiler);

		// Call the registered function with a mock compilation and callback
		var compilation = {
			errors: [],
			assets: {}
		};

		compiler.emitFn(compilation, function() {
			// After the callback has been called, check the compilation assets
			try {
				if (expectedAssetKeys.length > 0) {
					expect(compilation.assets).to.have.all.keys(expectedAssetKeys);
				} else {
					expect(compilation.assets).to.be.empty;
				}

				expect(compilation.errors).to.be.empty;
		    done();
			} catch(e) {
		    done(e);
			}
		});
	}

	describe('error handling', function() {
		it('doesn\'t throw an error if no patterns are passed', function(done) {
			run(undefined,
					[],
					done);
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
			run([{ from: 'file.txt' }],
					['file.txt'],
					done);
		});

		it('can move a file to a new directory without a forward slash', function(done) {
			run([{ from: 'file.txt', to: 'newdirectory' }],
					['newdirectory/file.txt'],
					done);
		});

		it('can move a file to a new directory with a forward slash', function(done) {
			run([{ from: 'file.txt', to: 'newdirectory/' }],
					['newdirectory/file.txt'],
					done);
		});

		it('can move a file to a new directory with an extension', function(done) {
			run([{ from: 'file.txt', to: 'newdirectory.ext', toType: 'dir' }],
					['newdirectory.ext/file.txt'],
					done);
		});

		it('can move a file to a new directory with an extension and forward slash', function(done) {
			run([{ from: 'file.txt', to: 'newdirectory.ext/' }],
					['newdirectory.ext/file.txt'],
					done);
		});

		it('can move a file to a new file with a different name', function(done) {
			run([{ from: 'file.txt', to: 'newname.txt' }],
					['newname.txt'],
					done);
		});

		it('can move a file to a new file with no extension', function(done) {
			run([{ from: 'file.txt', to: 'newname', toType: 'file' }],
					['newname'],
					done);
		});

		it('can move a nested file to the root directory', function(done) {
			run([{ from: 'directory/directoryfile.txt' }],
					['directoryfile.txt'],
					done);
		});

		it('can move a nested file to a new directory', function(done) {
			run([{ from: 'directory/directoryfile.txt', to: 'newdirectory' }],
					['newdirectory/directoryfile.txt'],
					done);
		});
	});

	describe('with directory in from', function() {
		it('can move a directory\'s contents to the root directory', function(done) {
			run([{ from: 'directory' }],
					['directoryfile.txt', 'nested/nestedfile.txt'],
					done);
		});

		it('can move a directory\'s contents to a new directory', function(done) {
			run([{ from: 'directory', to: 'newdirectory' }],
					['newdirectory/directoryfile.txt','newdirectory/nested/nestedfile.txt'],
					done);
		});

		it('can move a nested directory\'s contents to the root directory', function(done) {
			run([{ from: 'directory/nested' }],
					['nestedfile.txt'],
					done);
		});

		it('can move a nested directory\'s contents to a new directory', function(done) {
			run([{ from: 'directory/nested', to: 'newdirectory' }],
					['newdirectory/nestedfile.txt'],
					done);
		});
	});
});