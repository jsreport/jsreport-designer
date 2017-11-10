
const webpack = require('webpack')
const getBabelPreset = require('./config/getBabelPreset')
const getStyles = require('./config/getStyles')
const createCompiler = require('./createCompiler')

module.exports = {
  createCompiler,
  getBabelPreset,
  getStylesConfig: getStyles,
  dirname: __dirname,
  deps: {
    webpack,
    webpackDevMiddleware: require('webpack-dev-middleware'),
    webpackHotMiddleware: require('webpack-hot-middleware'),
    webpackHotDevClientPath: require.resolve('./config/customWebpackHotDevClient'),
    errorOverlayMiddleware: require('react-dev-utils/errorOverlayMiddleware'),
    HtmlWebpackPlugin: require('html-webpack-plugin'),
    CaseSensitivePathsPlugin: require('case-sensitive-paths-webpack-plugin'),
    WatchMissingNodeModulesPlugin: require('react-dev-utils/WatchMissingNodeModulesPlugin')
  }
}
