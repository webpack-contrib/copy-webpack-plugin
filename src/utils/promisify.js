export const stat = (inputFileSystem, path) =>
  new Promise((resolve, reject) => {
    inputFileSystem.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });

export const readFile = (inputFileSystem, path) =>
  new Promise((resolve, reject) => {
    inputFileSystem.readFile(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });
