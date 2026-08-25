module.exports = {
  ignores: ['.next', 'node_modules', 'backup', 'dist'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json'
      },
      plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'import',
        'jsx-a11y',
        'prettier'
      ],
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
        'next/core-web-vitals'
      ],
      settings: { react: { version: 'detect' } },
      rules: {}
    }
  ]
};
