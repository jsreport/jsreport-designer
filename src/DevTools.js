import React, { Component } from 'react'
import jsreportClient from 'jsreport-browser-client-dist'

jsreportClient.serverUrl = 'http://localhost:5488'

class DevTools extends Component {
  constructor (props) {
    super(props)

    this.state = {
      inspectMeta: null
    }
  }

  getDesignMeta () {
    const {
      baseWidth,
      baseColWidth,
      components
    } = this.props

    return {
      grid: {
        width: baseWidth,
        baseColWidth: baseColWidth
      },
      components: components
    }
  }

  onClickInspect () {
    this.setState({
      inspectMeta: JSON.stringify(this.getDesignMeta(), null, 2)
    })
  }

  onClickPreview (recipe) {
    jsreportClient.render('_blank', {
      template: {
        designer: this.getDesignMeta(),
        recipe: recipe
      }
    })
  }

  render () {
    const {
      inspectMeta
    } = this.state

    const {
      gridRows
    } = this.props

    return (
      <div style={{ position: 'absolute', top: '8px', right: '200px' }}>
        <b>TOTAL ROWS: {gridRows.length}, TOTAL: COLS: { gridRows.length * 12 }</b>
        {' '}
        <button onClick={() => this.onClickInspect()}>Inspect Designer meta-data</button>
        <button onClick={() => this.onClickPreview('phantom-pdf')}>Preview pdf</button>
        <button onClick={() => this.onClickPreview('html')}>Preview html</button>
        {
          inspectMeta && (
            <div style={{ backgroundColor: 'yellow', padding: '8px', position: 'absolute', top: '22px', right: '320px', zIndex: 100 }}>
              <button onClick={() => this.setState({ inspectMeta: null })}>Close</button>
              <br/>
              <textarea rows="25" cols="40" defaultValue={inspectMeta} />
              <br />
              <button onClick={() => this.setState({ inspectMeta: null })}>Close</button>
            </div>
          )
        }
      </div>
    )
  }
}

export default DevTools
