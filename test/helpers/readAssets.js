import readAsset from "./readAsset";

/**
 * @param {import("webpack").Compiler} compiler The webpack compiler instance
 * @param {{ compilation: { assets: { [key: string]: unknown } } }} stats The webpack stats object
 * @returns {{ [key: string]: unknown }} An object mapping asset names to their content
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
