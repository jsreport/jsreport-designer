
var assign = require('lodash/assign')
var main = require('./lib/designer')
var config = require('./jsreport.config')

module.exports = function (options) {
  let newConfig = assign({}, config)

  newConfig.options = options
  newConfig.main = main
  newConfig.directory = __dirname

  return newConfig
}
