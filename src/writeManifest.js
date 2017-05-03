'use strict';

const fs = require('fs')
const manifest = 'webpack-manifest.json';
const version = '1.0';

let manifestSrc = {version: version, assets: []};

const writeManifest = (compilation, assets, cb) => {
    // Insert this list into the Webpack build as a new file asset:
    manifestSrc.assets = assets;
    fs.writeFileSync(manifest, JSON.stringify(manifestSrc));
    cb();
}

module.exports = writeManifest;

