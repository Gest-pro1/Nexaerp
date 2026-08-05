module.exports = [
  // Ignore common build and dependency folders
  {
    ignores: ['.next', 'node_modules', 'backup', 'dist']
  },
  // Basic file-level config using TypeScript parser and React settings.
  // This is intentionally minimal to avoid errors while running ESLint v9 flat config.
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      import: require('eslint-plugin-import'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      prettier: require('eslint-plugin-prettier')
    },
    settings: { react: { version: 'detect' } },
    rules: {}
  }
];
