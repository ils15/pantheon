module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.startsWith('Changes before error encountered')],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'agents',
        'skills',
        'sync',
        'platform',
        'scripts',
        'docs',
        'ci',
        'deps',
        'release',
        'config',
      ],
    ],
  },
}
