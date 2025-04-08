module.exports = {
  extends: [
    'next/core-web-vitals',
  ],
  rules: {
    // Add any custom rules here
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  parserOptions: {
    project: './tsconfig.json',
  },
};