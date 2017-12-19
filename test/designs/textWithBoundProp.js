module.exports = () => ({
  'leftSpace': 3,
  'space': 1,
  'minSpace': 1,
  'components': [
    {
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
    }
  ]
})
