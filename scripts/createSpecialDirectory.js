const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const removeIllegalCharacterForWindows = require('./removeIllegalCharacterForWindows');

const baseDir = 'compiled_tests/helpers';

const specialFiles = {
    '[special?directory]/nested/nestedfile.txt': '',
    '[special?directory]/(special-*file).txt': 'special',
    '[special?directory]/directoryfile.txt': 'new'
};

Object.keys(specialFiles).forEach(function (originFile) {
    const file = removeIllegalCharacterForWindows(originFile);
    const dir = path.dirname(file);
    mkdirp.sync(path.join(baseDir, dir));
    fs.writeFileSync(path.join(baseDir, file), specialFiles[originFile]);
});

