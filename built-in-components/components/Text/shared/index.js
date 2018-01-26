
module.exports = {
  getDefaultProps () {
    return {
      text: 'Sample text'
    }
  },
  template () {
    return (
      `
      <div style="{{$resolveStyle "style"}}">
        <span>{{text}}</span>
      </div>
      `
    )
  }
}
