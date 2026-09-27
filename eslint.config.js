// ESLint: checks code for mistakes. Run with `npx eslint .` (part of `npm run check`).
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['.export-check/*', '.expo/*', 'dist/*', 'reference/*']),
  expoConfig,
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
