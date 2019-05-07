export function removeIllegalCharacterForWindows(string) {
  return process.platform !== 'win32'
    ? string
    : string.replace(/[*?"<>|]/g, '');
}

export function removeIllegalCharacterAndSepForWindows(string) {
  return process.platform !== 'win32'
    ? string
    : string.replace(/[*?"<>|]/g, '').replace(/\\/g, '/');
}
