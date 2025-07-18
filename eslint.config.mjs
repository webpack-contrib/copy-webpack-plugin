import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";

export default defineConfig([
  {
    extends: [configs["recommended-dirty"]],
    rules: {
      "jsdoc/require-property-description": "off",
      "jest/expect-expect": "off",
    },
  },
]);
