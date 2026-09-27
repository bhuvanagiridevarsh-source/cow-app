// ESLint: checks code for mistakes. Run with `npx eslint .` (part of `npm run check`).
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['.export-check/*', '.expo/*', 'dist/*', 'reference/*']),
  expoConfig,
]);
