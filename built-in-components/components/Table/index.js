
const path = require('path')

module.exports = (reporter, definition) => ({
  name: 'Table',
  description: '',
  propsMeta: {
    data: {
      allowedBindingValueTypes: ['array']
    },
    columns: {
      allowsBinding: false,
      properties: {
        name: {
          allowedBindingValueTypes: ['scalar']
        },
        value: {
          allowedBindingValueTypes: ['scalar']
        }
      }
    }
  },
  modulePath: path.join(__dirname, 'shared/index.js'),
  directory: __dirname
})
