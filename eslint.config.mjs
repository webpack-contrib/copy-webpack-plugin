import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";
import eslintPluginJest from "eslint-plugin-jest";

export default defineConfig([
  {
    extends: [configs["recommended-dirty"]],
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      "jest/expect-expect": [
        "error",
        {
          assertFunctionNames: ["expect", "runEmit", "runForce", "runChange"],
        },
      ],
    },
  },
]);
