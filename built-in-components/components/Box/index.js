
const path = require('path')

module.exports = (reporter, definition) => ({
  name: 'Box',
  description: '',
  fragments: {
    content: {
      mode: 'component'
    }
  },
  modulePath: path.join(__dirname, 'shared/index.js'),
  directory: __dirname
})
