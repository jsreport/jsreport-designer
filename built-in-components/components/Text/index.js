
const path = require('path')

module.exports = (reporter, definition) => ({
  name: 'Text',
  description: '',
  propsMeta: {
    text: {
      allowsRichContent: true,
      allowedBindingValueTypes: ['scalar']
    }
  },
  modulePath: path.join(__dirname, 'shared/index.js'),
  directory: __dirname
})
