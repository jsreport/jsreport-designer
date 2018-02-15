
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
  fragments: {
    header: {
      propsMeta: {
        text: null
      },
      fragments: {
        content: {
          propsMeta: {
            text: null
          }
        }
      }
    },
    footer: {
      propsMeta: {
        text: null
      },
      fragments: {
        content: {
          propsMeta: {
            text: null
          }
        }
      }
    }
  },
  modulePath: path.join(__dirname, 'shared/index.js'),
  directory: __dirname
})
