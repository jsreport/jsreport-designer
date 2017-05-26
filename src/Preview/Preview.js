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
const BASE_HEIGHT = 980 * 1.414
const COLS = 12
const ROWS = 18

class Preview extends Component {
  constructor (props) {
    super(props)

    this.state = {
      components: []
    }

    this.onBeginHoverCanvas = this.onBeginHoverCanvas.bind(this)
    this.onHoverCanvas = this.onHoverCanvas.bind(this)
    this.onDropCanvas = this.onDropCanvas.bind(this)
  }

  addComponentToCanvas(comp) {
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
          width: BASE_WIDTH,
          height: BASE_HEIGHT
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
    const baseHeight = BASE_HEIGHT
    const gridCols = COLS
    const gridRows = ROWS

    const {
      components
    } = this.state

    let paddingLeftRight = 25
    let grid

    if (gridRows != null && gridCols != null) {
      grid = {
        rows: gridRows,
        cols: gridCols
      }
    }

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
            height={baseHeight}
            grid={grid}
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
