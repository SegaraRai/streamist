// @ts-check
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  plugins: ['unicorn', '@typescript-eslint', 'vue'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  rules: {
    // rules obtained from Nuxt

    'import/first': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-unresolved': 'off',
    'generator-star-spacing': 'off',
    'no-debugger': 'error',
    'no-console': 'warn',
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false,
      },
    ],
    'no-lonely-if': 'error',
    curly: ['error', 'all'],
    'require-await': 'error',
    'dot-notation': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'no-useless-rename': 'error',

    'unicorn/error-message': 'error',
    'unicorn/escape-case': 'error',
    'unicorn/no-array-instanceof': 'error',
    'unicorn/no-new-buffer': 'error',
    'unicorn/no-unsafe-regex': 'off',
    'unicorn/number-literal-case': 'off',
    'unicorn/prefer-exponentiation-operator': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-starts-ends-with': 'error',
    'unicorn/prefer-text-content': 'error',
    'unicorn/prefer-type-error': 'error',
    'unicorn/throw-new-error': 'error',

    // TypeScript rules

    'no-undef': 'off',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { args: 'all', argsIgnorePattern: '^_' },
    ],

    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],

    // our rules

    'no-constant-condition': [
      'warn',
      {
        checkLoops: false,
      },
    ],
    'arrow-parens': ['error', 'always'],
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
    'import/named': 'off',
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
        groups: [
          'builtin',
          'external',
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
        pathGroupsExcludedImportTypes: ['builtin', 'external'],
      },
    ],

    '@typescript-eslint/no-non-null-assertion': ['warn'],

    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    'vue/component-name-in-template-casing': [
      'error',
      'PascalCase',
      {
        registeredComponentsOnly: false,
        ignores: ['i18n-t', '/^i-/'],
      },
    ],
  },
  settings: {
    'import/internal-regex': '^[~$]',
  },
});
