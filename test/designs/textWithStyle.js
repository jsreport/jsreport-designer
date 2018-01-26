module.exports = () => ({
  type: 'Text',
  props: {
    text: 'Sample text',
    style: {
      background: {
        color: {
          r: 202,
          g: 39,
          b: 39,
          a: 1
        }
      },
      fontSize: {
        unit: 'px',
        size: 14
      },
      textAlign: 'center'
    }
  }
})
