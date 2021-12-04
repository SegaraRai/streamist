module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: ['@nuxtjs/eslint-config-typescript', 'prettier'],
  rules: {
    'import/named': 'off',
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],
    'spaced-comment': [
      'warn',
      'always',
      {
        line: {
          exceptions: ['-', '+', '*/'],
          markers: ['=', '!', '/'],
        },
      },
    ],
  },
};
