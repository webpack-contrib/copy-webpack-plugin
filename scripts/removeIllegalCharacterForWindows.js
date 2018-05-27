const path = require('path');

module.exports = function (string) {
    return path.sep === '/' ? string : string.replace(/[*?"<>|]/g, '');
};
