
module.exports = {
  getDefaultProps () {
    return {
      style: {
        width: {
          unit: 'px',
          size: 100
        },
        height: {
          unit: 'px',
          size: 100
        }
      }
    }
  },
  template () {
    return (
      `{{$renderFragment
        name="content"
        tag="div"
        style=($resolveStyle "style")
      }}`
    )
  }
}
