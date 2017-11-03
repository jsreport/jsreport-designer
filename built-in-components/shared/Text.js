
module.exports.getDefaultProps = function () {
  return {
    text: 'Sample text'
  }
}

module.exports.template = function () {
  return (
    `
      <span>{{text}}</span>
    `
  )
}
