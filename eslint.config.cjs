module.exports = [
  // Ignore common build and dependency folders
  {
    ignores: ['.next', 'node_modules', 'backup', 'dist']
  },
  // Shareable configs and recommended presets (flat configs accept strings in the array)
  'eslint:recommended',
  'plugin:react/recommended',
  'plugin:react-hooks/recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:import/errors',
  'plugin:import/warnings',
  'plugin:jsx-a11y/recommended',
  'plugin:prettier/recommended',
  'next/core-web-vitals',
  // File-level overrides and parser options
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json'
      }
    },
    settings: { react: { version: 'detect' } },
    rules: {}
  }
];
