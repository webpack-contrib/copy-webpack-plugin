module.exports = function (string) {
    return process.platform !== 'win32' ? string : string.replace(/[*?"<>|]/g, '');
};

