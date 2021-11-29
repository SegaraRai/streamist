module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: ['@antfu', 'prettier'],
  rules: {
    'spaced-comment': [
      'warn',
      {
        line: {
          exceptions: ['-', '+', '*/'],
          markers: ['=', '!', '/'],
        },
      },
    ],
  },
};
