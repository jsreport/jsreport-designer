module.exports = () => ({
  type: 'Text',
  props: {
    text: 'Sample text'
  },
  bindings: {
    text: {
      compose: {
        content: '<div><code data-jsreport-designer-expression-name="price">[price]</code>&nbsp;</div>'
      },
      expression: [
        'price'
      ]
    }
  },
  expressions: {
    text: {
      price: {
        type: 'function',
        value: "function (context) {\n  if (context.price > 1000) {\n    return '$.' + context.price + ' (high)'\n  } else {\n    return '$.' + context.price + ' (low)'\n  }\n}"
      }
    }
  }
})
