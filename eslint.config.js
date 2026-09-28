// ESLint: checks code for mistakes. Run with `npx eslint .` (part of `npm run check`).
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['.export-check/*', '.expo/*', 'dist/*', 'reference/*']),
  expoConfig,
  {
    // Helper scripts run in Node (e.g. npm run sync-legal).
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', require: 'readonly', module: 'writable', process: 'readonly', console: 'readonly' },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Import icons one at a time (phosphor-react-native/src/icons/<Name>) so the app
      // only bundles the icons it uses. Type-only imports from the root are fine.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phosphor-react-native',
              message: "Import icons from 'phosphor-react-native/src/icons/<Name>' instead.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
