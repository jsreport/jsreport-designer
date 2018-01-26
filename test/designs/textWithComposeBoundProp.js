module.exports = () => ({
  type: 'Text',
  props: {
    text: 'Sample text'
  },
  bindings: {
    text: {
      compose: {
        content: '<div>My name is <code data-jsreport-designer-expression-name="name">[name]</code>&nbsp;</div>'
      },
      expression: [
        'name'
      ]
    }
  },
  expressions: {
    text: {
      name: {
        type: 'data',
        value: [
          'p:name'
        ]
      }
    }
  }
})
