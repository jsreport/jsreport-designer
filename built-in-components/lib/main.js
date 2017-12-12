
module.exports = (reporter, definition) => {
  reporter.initializeListeners.add('designer-built-in-components', () => {
    reporter.designer.registerComponent(require('../components/Text')(reporter, definition))
    reporter.designer.registerComponent(require('../components/Image')(reporter, definition))
    reporter.designer.registerComponent(require('../components/Table')(reporter, definition))

    // NOTE: next are placeholder components just to fill component bar in designer
    // (delete them later)
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
  })
}
