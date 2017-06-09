var React = require('react')

module.exports = function Image (props) {
  return (
    React.createElement(
      'img',
      { src: props.url, style: { width: props.width, height: props.height } }
    )
  )
}
