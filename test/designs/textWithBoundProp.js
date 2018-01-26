module.exports = () => ({
  'type': 'Text',
  'props': {
    'text': 'Sample text'
  },
  'bindings': {
    'text': {
      'expression': '$dataSelect'
    }
  },
  'expressions': {
    'text': {
      '$dataSelect': {
        'type': 'data',
        'value': [
          'p:foo'
        ]
      }
    }
  }
})
