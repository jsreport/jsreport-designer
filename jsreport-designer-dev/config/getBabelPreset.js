
module.exports = function getBabelPreset () {
  // note that ordering in plugins and presets are different
  // see https://babeljs.io/docs/plugins/#plugin-preset-ordering
  // for more info.
  // we use "transform-decorators-legacy" to enable decorators
  // in MobX code
  return {
    plugins: [
      require.resolve('babel-plugin-transform-decorators-legacy'),
      // this plugin allows importing commonjs modules as es modules
      // (something we will do frequentlly in designer since components are
      // files shared in server and client)
      // see https://gitlab.com/sebdeckers/babel-plugin-transform-commonjs-es2015-modules
      // for how different commonjs exports match ES exports
      require.resolve('babel-plugin-transform-commonjs-es2015-modules'),
      // "babel-plugin-transform-runtime" is defined in "babel-preset-react-app"
      // but centralizing babel helpers was disabled, we enable it here to prevent
      // duplicating the helpers in extensions.
      // however it seems like babel also add unnecesary polyfills when enabling helpers
      // and this seems like something that would be more optimized in babel 7
      // https://github.com/facebookincubator/create-react-app/issues/2391
      [require.resolve('babel-plugin-transform-runtime'), {
        helpers: true,
        regenerator: true
      }],
    ],
    presets: [
      require.resolve('babel-preset-react-app')
    ]
  }
}
