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
      emptyGroupHeight,
      numberOfCols,
      designGroups
    } = this.props

    let lastGroupWithContent
    let designGroupsToSend = []

    designGroups.forEach((dg, idx) => {
      let topSpace

      if (dg.items.length === 0) {
        return
      }

      // calculating topSpace between designGroups
      if (lastGroupWithContent != null) {
        topSpace = ((idx - lastGroupWithContent) - 1) * emptyGroupHeight
      } else {
        topSpace = idx * emptyGroupHeight
      }

      if (topSpace != null && topSpace > 0) {
        dg.topSpace = topSpace
      }

      lastGroupWithContent = idx
      designGroupsToSend.push(dg)
    })

    // filtering unnecessary data
    var designGroupsPayload = designGroupsToSend.map((designGroup) => {
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

  onInspectGroupsClick () {
    this.setState({
      inspectDesignGroups: JSON.stringify(this.props.designGroups, null, 2)
    })
  }

  onInspectPayloadClick () {
    this.setState({
      inspectDesignPayload: JSON.stringify(this.getDesignPayload(), null, 2)
    })
  }

  onPreviewClick (recipe) {
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
      designGroups
    } = this.props

    return (
      <div style={{ position: 'absolute', top: '8px', right: '200px', zIndex: 100 }}>
        <b>GRID: {numberOfCols} x {designGroups.length}, TOTAL ROWS: {designGroups.length}</b>
        {' '}
        <button onClick={() => this.onInspectGroupsClick()}>Inspect Design groups</button>
        <button onClick={() => this.onInspectPayloadClick()}>Inspect Design payload</button>
        <button onClick={() => this.onPreviewClick('phantom-pdf')}>Preview pdf</button>
        <button onClick={() => this.onPreviewClick('html')}>Preview html</button>
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
