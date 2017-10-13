
const main = require('./lib/designer')
const config = require('./jsreport.config')

module.exports = function (options) {
  let newConfig = Object.assign({}, config)

  newConfig.options = options
  newConfig.main = main
  newConfig.directory = __dirname

  return newConfig
}
