
module.exports = {
  getDefaultProps () {
    return {
      url: 'http://www.euneighbours.eu/sites/default/files/2017-01/placeholder.png',
      width: 100,
      height: 100
    }
  },
  template () {
    return (
      `
      <div style="display: inline-block; width: {{width}}px; height: {{height}}px">
        <img style="width: 100%; height: 100%; vertical-align: top" src="{{url}}" />
      </div>
      `
    )
  }
}
