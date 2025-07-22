const fs = require("node:fs");
const path = require("node:path");

const removeIllegalCharacterForWindows = require("./test/helpers/removeIllegalCharacterForWindows");

const baseDir = path.resolve(__dirname, "test/fixtures");

const specialFiles = {
  "[special$directory]/nested/nestedfile.txt": "",
  "[special$directory]/(special-*file).txt": "special",
  "[special$directory]/directoryfile.txt": "new",
};

module.exports = () => {
  for (const originFile of Object.keys(specialFiles)) {
    const file = removeIllegalCharacterForWindows(originFile);
    const dir = path.dirname(file);

    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
    fs.writeFileSync(path.join(baseDir, file), specialFiles[originFile]);
  }
};
