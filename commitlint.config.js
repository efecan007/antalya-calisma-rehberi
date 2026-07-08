module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // scope zorunlu: "type(scope): message" — scope'suz commit reddedilir.
    'scope-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'build', 'ci'],
    ],
  },
};
