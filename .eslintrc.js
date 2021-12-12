// @ts-check
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: ['@nuxtjs/eslint-config-typescript', 'prettier'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/no-v-for-template-key': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'never',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
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
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        allowSeparatedGroups: true,
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
        groups: [
          ['builtin', 'external'],
          'unknown',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: '$/**',
            group: 'internal',
          },
          {
            pattern: '$prisma/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '$*/**',
            group: 'unknown',
          },
        ],
      },
    ],
  },
});
