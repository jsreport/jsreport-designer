
const webpack = require('webpack')

function createCompiler (config) {
  const compiler = webpack(config)

  // temporal fix until webpack recompilation loop bug is fixed
  // (fix taken from https://github.com/webpack/watchpack/issues/25#issuecomment-319292564)
  // https://github.com/webpack/watchpack/issues/25
  // https://github.com/webpack/webpack/issues/2983
  const timefix = 11000;

  compiler.plugin('watch-run', (watching, callback) => {
    watching.startTime += timefix;
    callback()
  })

  compiler.plugin('done', (stats) => {
    stats.startTime -= timefix
  })
  // --end temporal fix

  return compiler
}

module.exports = {
  createCompiler,
  dirname: __dirname,
  deps: {
    webpack,
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
