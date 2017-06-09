var React = require('react')

module.exports = function Text (props) {
  return (
    React.createElement(
      'span',
      { style: { backgroundColor: 'darkgreen', display: 'inline-block', width: '100%', height: '100%' } },
      props.text
    )
  )
}
