import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import shortid from 'shortid'
import Canvas from './Canvas'
import './Preview.css'

/*
  base width and base height depends on the target paper format
  A4 -> 980px width, with a factor of 1.414 aprox for height
*/
// values as constants for now
const BASE_WIDTH = 980
const NUMBER_OF_COLS = 12
const DEFAULT_ROW_HEIGHT = 78

class Preview extends Component {
  constructor (props) {
    super(props)

    this.state = {
      components: [],
      gridRows: this.getInitialGridRows({
        numberOfCols: NUMBER_OF_COLS,
        defaultRowHeight: DEFAULT_ROW_HEIGHT
      })
    }

    this.onBeginHoverCanvas = this.onBeginHoverCanvas.bind(this)
    this.onHoverCanvas = this.onHoverCanvas.bind(this)
    this.onDropCanvas = this.onDropCanvas.bind(this)
  }

  getInitialGridRows ({ defaultRowHeight, numberOfCols }) {
    let rows = []
    let defaultNumberOfRows = 6

    for (let i = 0; i < defaultNumberOfRows; i++) {
      rows.push({
        index: i,
        height: defaultRowHeight,
        unit: 'px',
        cols: this.getInitialGridCols(i, numberOfCols)
      })
    }

    // plus one for
    rows.push({
      index: rows.length,
      height: defaultRowHeight,
      unit: 'px',
      cols: this.getInitialGridCols(rows.length, numberOfCols),
      placeholder: true
    })

    return rows
  }

  getInitialGridCols (rowIndex, numberOfCols) {
    let cols = []

    for (let i = 0; i < numberOfCols; i++) {
      cols.push({
        row: rowIndex,
        index: i,
        width: 100/numberOfCols,
        unit: '%'
      })
    }

    return cols
  }

  getTotalHeightOfRows (rows) {
    return rows.reduce((acu, row) => acu + row.height, 0)
  }

  addComponentToCanvas (comp) {
    let compProps = comp.props || {}

    // call here a function to get a default props depending of the component type
    if (comp.componentType === 'Text') {
      compProps = {
        ...compProps,
        text: 'Sample Text'
      }
    }

    this.setState({
      components: [
        ...this.state.components,
        {
          ...comp,
          id: shortid.generate(),
          props: compProps
        }
      ]
    })
  }

  onClickInspect () {
    this.setState({
      inspectMeta: JSON.stringify({
        grid: {
          width: BASE_WIDTH
        },
        components: this.state.components
      }, null, 2)
    })
  }

  onBeginHoverCanvas ({ item, clientOffset, initialSourceClientOffset, initialClientOffset }) {
    const canvasOffset = findDOMNode(this.canvasRef).getBoundingClientRect()

    this.startPosition = {
      x: clientOffset.x,
      y: clientOffset.y
    }

    this.startRect = {
      top: (this.startPosition.y - canvasOffset.top) - (initialClientOffset.y - initialSourceClientOffset.y),
      left: (this.startPosition.x - canvasOffset.left) - (initialClientOffset.x - initialSourceClientOffset.x)
    }

    // console.log('original calculus top:', (this.startPosition.y - canvasOffset.top) - (item.defaultSize.height / 2))
    // console.log('original calculus left:', (this.startPosition.x - canvasOffset.left) - (item.defaultSize.width / 2))
  }

  onHoverCanvas ({ clientOffset }) {
    console.log('while hover top:', this.startRect.top + ((clientOffset.y - this.startPosition.y)))
    console.log('while hover left:', this.startRect.left + ((clientOffset.x - this.startPosition.x)))
  }

  onDropCanvas ({ item, clientOffset }) {
    const top = this.startRect.top + (clientOffset.y - this.startPosition.y)
    const left = this.startRect.left + (clientOffset.x - this.startPosition.x)

    this.addComponentToCanvas({
      componentType: item.name,
      componentTypeId: item.id,
      position: {
        top: top,
        left: left
      },
      props: item.props
    })

    this.startPosition = null
    this.startRect = null
  }

  render () {
    const baseWidth = BASE_WIDTH

    const {
      components,
      gridRows
    } = this.state

    let totalHeight = this.getTotalHeightOfRows(gridRows)
    let paddingLeftRight = 25

    let inspectButton = (
      <div style={{ position: 'absolute', top: '8px', right: '200px' }}>
        <button onClick={() => this.onClickInspect()}>Inspect Designer meta-data</button>
      </div>
    )

    return (
      <div className="Preview-container">
        {inspectButton}
        {this.state.inspectMeta && (
          <div style={{ backgroundColor: 'yellow', padding: '8px', position: 'absolute', top: '8px', right: '400px', zIndex: 2 }}>
            <button onClick={() => this.setState({ inspectMeta: null })}>Close</button>
            <br/>
            <textarea rows="25" cols="40" defaultValue={this.state.inspectMeta} />
            <br />
            <button onClick={() => this.setState({ inspectMeta: null })}>Close</button>
          </div>
        )}
        <div
          className="Preview-canvas"
          style={{
            minWidth: baseWidth + (paddingLeftRight * 2) + 'px',
            paddingLeft: paddingLeftRight + 'px',
            paddingRight: paddingLeftRight + 'px',
            paddingBottom: '40px',
            paddingTop: '40px'
          }}
        >
          <Canvas
            ref={(el) => this.canvasRef = el}
            width={baseWidth}
            height={totalHeight}
            gridRows={gridRows}
            components={components}
            onBeginHover={this.onBeginHoverCanvas}
            onHover={this.onHoverCanvas}
            onDrop={this.onDropCanvas}
          />
        </div>
      </div>
    )
  }
}

export default Preview
