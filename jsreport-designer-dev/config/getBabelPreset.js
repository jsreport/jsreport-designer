
module.exports = function getBabelPreset () {
  // note that ordering in plugins and presets are different
  // see https://babeljs.io/docs/plugins/#plugin-preset-ordering
  // for more info.
  // we use "transform-decorators-legacy" to enable decorators
  // in MobX code
  return {
    plugins: [require.resolve('babel-plugin-transform-decorators-legacy')],
    presets: [
      require.resolve('babel-preset-react-app')
    ]
  }
}
