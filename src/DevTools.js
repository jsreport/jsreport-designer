import React, { Component } from 'react'
import jsreportClient from 'jsreport-browser-client-dist'

jsreportClient.serverUrl = 'http://localhost:5488'

class DevTools extends Component {
  constructor (props) {
    super(props)

    this.state = {
      inspectDesignGroups: null,
      inspectDesignPayload: null
    }
  }

  getDesignPayload () {
    const {
      baseWidth,
      numberOfCols,
      designGroups
    } = this.props

    // filtering unnecessary data
    var designGroupsPayload = designGroups.map((designGroup) => {
      var group = {
        items: designGroup.items.map((designItem) => {
          var item = {
            space: designItem.space,
            components: designItem.components.map((designComponent) => {
              return {
                type: designComponent.type,
                props: designComponent.props
              }
            })
          }

          if (designItem.leftSpace != null) {
            item.leftSpace = designItem.leftSpace
          }

          return item
        }),
        layoutMode: designGroup.layoutMode
      }

      if (designGroup.topSpace != null) {
        group.topSpace = designGroup.topSpace
      }

      return group
    })

    return {
      grid: {
        width: baseWidth,
        numberOfCols: numberOfCols
      },
      groups: designGroupsPayload
    }
  }

  onClickInspectGroups () {
    this.setState({
      inspectDesignGroups: JSON.stringify(this.props.designGroups, null, 2)
    })
  }

  onClickInspectPayload () {
    this.setState({
      inspectDesignPayload: JSON.stringify(this.getDesignPayload(), null, 2)
    })
  }

  onClickPreview (recipe) {
    jsreportClient.render('_blank', {
      template: {
        design: this.getDesignPayload(),
        recipe: recipe
      }
    })
  }

  render () {
    const {
      inspectDesignGroups,
      inspectDesignPayload
    } = this.state

    const {
      numberOfCols,
      gridRows
    } = this.props

    return (
      <div style={{ position: 'absolute', top: '8px', right: '200px' }}>
        <b>GRID: {numberOfCols} x {gridRows.length}, TOTAL ROWS: {gridRows.length}, TOTAL: COLS: { gridRows.length * 12 }</b>
        {' '}
        <button onClick={() => this.onClickInspectGroups()}>Inspect Design groups</button>
        <button onClick={() => this.onClickInspectPayload()}>Inspect Design payload</button>
        <button onClick={() => this.onClickPreview('phantom-pdf')}>Preview pdf</button>
        <button onClick={() => this.onClickPreview('html')}>Preview html</button>
        {
          inspectDesignGroups && (
            <div style={{ backgroundColor: 'yellow', padding: '8px', position: 'absolute', top: '22px', right: '360px', zIndex: 100 }}>
              <b>Design groups</b>
              <br />
              <button onClick={() => this.setState({ inspectDesignGroups: null })}>Close</button>
              <br/>
              <textarea rows="25" cols="40" defaultValue={inspectDesignGroups} />
              <br />
              <button onClick={() => this.setState({ inspectDesignGroups: null })}>Close</button>
            </div>
          )
        }
        {
          inspectDesignPayload && (
            <div style={{ backgroundColor: 'yellow', padding: '8px', position: 'absolute', top: '22px', right: '70px', zIndex: 100 }}>
              <b>Design payload</b>
              <br />
              <button onClick={() => this.setState({ inspectDesignPayload: null })}>Close</button>
              <br/>
              <textarea rows="25" cols="40" defaultValue={inspectDesignPayload} />
              <br />
              <button onClick={() => this.setState({ inspectDesignPayload: null })}>Close</button>
            </div>
          )
        }
      </div>
    )
  }
}

export default DevTools
