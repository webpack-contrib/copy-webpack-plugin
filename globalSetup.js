const path = require('path');
const fs = require('fs');

// eslint-disable-next-line import/no-extraneous-dependencies
const mkdirp = require('mkdirp');

const removeIllegalCharacterForWindows = require('./test/helpers/removeIllegalCharacterForWindows');

const baseDir = path.resolve(__dirname, 'test/fixtures');

const specialFiles = {
  '[special?directory]/nested/nestedfile.txt': '',
  '[special?directory]/(special-*file).txt': 'special',
  '[special?directory]/directoryfile.txt': 'new',
};

module.exports = () => {
  Object.keys(specialFiles).forEach((originFile) => {
    const file = removeIllegalCharacterForWindows(originFile);
    const dir = path.dirname(file);

    mkdirp.sync(path.join(baseDir, dir));

    fs.writeFileSync(path.join(baseDir, file), specialFiles[originFile]);
  });
};
