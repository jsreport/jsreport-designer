
module.exports = {
  getDefaultProps () {
    return {
      text: 'Sample text'
    }
  },
  template () {
    return (
      `
        <span>{{text}}</span>
      `
    )
  }
}
