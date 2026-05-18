module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'agents', 'skills', 'sync', 'platform',
      'scripts', 'docs', 'ci', 'deps', 'release', 'config'
    ]],
  },
};
