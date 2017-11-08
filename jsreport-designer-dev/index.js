

module.exports = {
  dirname: __dirname,
  deps: {
    webpack: require('webpack'),
    webpackDevMiddleware: require('webpack-dev-middleware'),
    webpackHotMiddleware: require('webpack-hot-middleware'),
    webpackHotDevClientPath: require.resolve('./config/customWebpackHotDevClient'),
    errorOverlayMiddleware: require('react-dev-utils/errorOverlayMiddleware'),
    // note that ordering in plugins and presets are different
    // see https://babeljs.io/docs/plugins/#plugin-preset-ordering
    // for more info.
    // we use "transform-decorators-legacy" to enable decorators
    // in MobX code
    babelPreset: {
      plugins: [require.resolve('babel-plugin-transform-decorators-legacy')],
      presets: [
        require.resolve('babel-preset-react-app')
      ]
    },
    HtmlWebpackPlugin: require('html-webpack-plugin'),
    CaseSensitivePathsPlugin: require('case-sensitive-paths-webpack-plugin'),
    WatchMissingNodeModulesPlugin: require('react-dev-utils/WatchMissingNodeModulesPlugin'),
    autoprefixer: require('autoprefixer'),
    'postcss-flexbugs-fixes': require('postcss-flexbugs-fixes')
  }
}
