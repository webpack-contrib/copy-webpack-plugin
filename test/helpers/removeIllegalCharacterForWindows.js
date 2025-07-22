module.exports = (string) =>
  process.platform !== "win32" ? string : string.replaceAll(/[*?"<>|]/g, "");
