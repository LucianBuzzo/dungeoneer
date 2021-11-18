// See https://github.com/stryker-mutator/stryker/tree/master/packages/stryker#readme
module.exports = (configuration) => {
  configuration.set({
    mutator: 'javascript',
    packageManager: 'npm',
    reporters: ['html', 'clear-text', 'progress'],
    testRunner: 'command',
    timeoutMS: 100000,
    commandRunner: {
      command: './node_modules/.bin/ava --fail-fast'
    },
    transpilers: [],
    // logLevel: 'debug',
    coverageAnalysis: 'off',
    files: [
      'package.json',
      'lib/*.js',
      'test/**/*.js',
      'test/**/*.json'
    ],
    mutate: ['lib/*.js']
  })
}
