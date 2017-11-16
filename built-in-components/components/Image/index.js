
const path = require('path')

module.exports = (reporter, definition) => ({
  name: 'Image',
  description: '',
  propsMeta: {
    url: {
      allowedBindingValueTypes: ['scalar']
    },
    width: {
      allowedBindingValueTypes: ['scalar']
    },
    height: {
      allowedBindingValueTypes: ['scalar']
    }
  },
  modulePath: path.join(__dirname, 'shared/index.js'),
  directory: __dirname
})
