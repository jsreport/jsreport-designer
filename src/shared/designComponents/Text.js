var Handlebars = require('handlebars')

var template = Handlebars.compile(`
  <span style="background-color:green;">{{text}}</span>
`)

module.exports.getDefaultProps = function () {
  return {
    text: 'Sample text'
  }
}

module.exports.template = template
