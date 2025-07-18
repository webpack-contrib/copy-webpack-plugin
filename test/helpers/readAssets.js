import readAsset from "./readAsset";

/**
 * @param compiler // compiler is required
 * @param stats // stats is required
 */
export default function readAssets(compiler, stats) {
  const assets = {};

  for (const asset of Object.keys(stats.compilation.assets).filter(
    (a) => a !== "main.js",
  )) {
    assets[asset] = readAsset(asset, compiler, stats);
  }

  return assets;
}
