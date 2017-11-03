const path = require('path')

module.exports = (reporter, definition) => {
  reporter.designer.registerComponent({
    name: 'Text',
    description: '',
    propsMeta: {
      text: {
        allowsRichContent: true,
        allowedBindingValueTypes: ['scalar']
      }
    }
  }, path.join(__dirname, '../shared/Text.js'))

  reporter.designer.registerComponent({
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
    }
  }, path.join(__dirname, '../shared/Image.js'))

  reporter.designer.registerComponent({
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
    }
  }, path.join(__dirname, '../shared/Table.js'))

  reporter.designer.registerComponent({
    name: 'Products-Map',
    description: '',
    group: 'Group1'
  })

  reporter.designer.registerComponent({
    name: 'Pie-Chart',
    description: '',
    group: 'Group2'
  })

  reporter.designer.registerComponent({
    name: 'QR',
    description: '',
    group: 'Group2'
  })

  reporter.designer.registerComponent({
    name: 'User-Info',
    description: '',
    group: 'Group2'
  })
}
