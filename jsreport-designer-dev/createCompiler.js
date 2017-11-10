const webpack = require('webpack')

module.exports = function createCompiler (config, cb, willWatch = true) {
  const compiler = webpack(config, cb)

  if (willWatch) {
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
  }

  return compiler
}
