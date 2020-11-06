module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: ['airbnb', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    semi: ['error', 'never'],
    'no-unused-vars': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-filename-extension': 'off',
    'no-param-reassign': 'off',
    'max-len': 120,
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'object-curly-newline': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        'react/prop-types': 'off',
        'react/jsx-props-no-spreading': 'off',
      },
    },
  ],
}
