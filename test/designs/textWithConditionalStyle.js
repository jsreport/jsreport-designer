module.exports = () => ({
  type: 'Text',
  props: {
    text: 'Sample text'
  },
  bindings: {
    '@style.color': {
      expression: [
        '_O0uq6P'
      ],
      compose: {
        content: {
          _O0uq6P: {
            r: 40,
            g: 52,
            b: 189,
            a: 1
          }
        },
        conditional: {
          default: {
            r: 193,
            g: 23,
            b: 23,
            a: 1
          }
        }
      }
    }
  },
  expressions: {
    '@style.color': {
      _O0uq6P: {
        type: 'function',
        value: 'function (context) {\n  return context.name !== \'test\'\n}'
      }
    }
  }
})
