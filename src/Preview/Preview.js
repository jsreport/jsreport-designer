import React, { Component } from 'react'
import shortid from 'shortid'
import { isInsideOfCol, findFilledArea } from './gridUtils'
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

    this.numberOfCols = NUMBER_OF_COLS

    this.state = {
      components: [],
      gridRows: this.getInitialGridRows({
        numberOfCols: this.numberOfCols,
        defaultRowHeight: DEFAULT_ROW_HEIGHT
      }),
      selectedArea: null,
      filledArea: null
    }

    this.onDragEnterCanvas = this.onDragEnterCanvas.bind(this)
    this.onDragLeaveCanvas = this.onDragLeaveCanvas.bind(this)
    this.onDragEndCanvas = this.onDragEndCanvas.bind(this)
    this.onDropCanvas = this.onDropCanvas.bind(this)
    this.getSelectedAreaFromCol = this.getSelectedAreaFromCol.bind(this)
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

  getSelectedAreaFromCol ({ col, colDimensions, item, clientOffset }) {
    let rowsCount = this.state.gridRows.length
    let colsCount = this.numberOfCols
    let isInside = true
    let { x: cursorOffsetX, y: cursorOffsetY } = clientOffset
    let { width, height, top, left } = colDimensions
    let colCenter = {}
    let maxFilledCols
    let maxFilledRows
    let projectedOffsetLimits

    let colInfo = {
      col: col.index,
      row: col.row,
      width,
      height,
      top,
      left
    }

    isInside = isInsideOfCol({ x: cursorOffsetX, y: cursorOffsetY }, colInfo)

    if (!isInside) {
      return
    }

    maxFilledCols = Math.ceil(item.defaultSize.width / width)
    maxFilledRows = Math.ceil(item.defaultSize.height / height)

    projectedOffsetLimits = {
      left: {
        x: cursorOffsetX - (item.defaultSize.width / 2),
        y: cursorOffsetY
      },
      top: {
        x: cursorOffsetX,
        y: cursorOffsetY - (item.defaultSize.height / 2)
      },
      right: {
        x: cursorOffsetX + (item.defaultSize.width / 2),
        y: cursorOffsetY
      },
      bottom: {
        x: cursorOffsetX,
        y: cursorOffsetY + (item.defaultSize.height / 2)
      }
    }

    // TODO: calculate limits/constraints
    // (if we should start to count for selected area from left/right/top/bottom
    // based on the orientation of the cursor to prevent placing items in
    // more cols/rows that they need to be)

    // TODO: test dragging while there is the scrollbar on viewport, just to see that
    // everything is behaving and placed correctly

    // TODO: add more rows when dropping something on the last row (placeholder row)
    // (maybe while dragging too)

    // TODO: make selected area calculation ignore filled cols
    // (or make selected area not filled when some part of the area is over filled part)

    // TODO: make more smart logic about row grouping and limits to not depend on row height
    // for position of components

    colCenter.x = left + (item.defaultSize.width / 2)
    colCenter.y = top + (item.defaultSize.height / 2)

    let isOnRightSide = (cursorOffsetX >= (colCenter.x + 2))
    let isOnBottomSide = (cursorOffsetY >= (colCenter.y + 2))

    // console.log('===============')
    // console.log('MAX FILLED ROWS:', maxFilledRows)
    // console.log('MAX FILLED COLS:', maxFilledCols)
    // console.log('IS ON RIGHT SIDE:', isOnRightSide)
    // console.log('IS ON BOTTOM SIDE:', isOnBottomSide)
    // console.log('===============')

    let selectedArea = findFilledArea(projectedOffsetLimits, colInfo, {
      colsCount,
      rowsCount
    })

    // console.log('SELECTED AREA:', selectedArea)

    // saving selectedArea in instance because it will be reset later
    // and we want to access this value later
    this.selectedArea = selectedArea

    this.setState({
      selectedArea
    })
  }

  addComponentToCanvas (comp, area) {
    let compProps = comp.props || {}
    let filledArea = this.state.filledArea || {}

    if (comp.componentType === 'Text') {
      compProps = {
        ...compProps,
        text: 'Sample Text'
      }
    }

    filledArea = {
      ...filledArea,
    }

    Object.keys(area).forEach((coord) => {
      if (filledArea[coord] == null) {
        filledArea[coord] = area[coord]
      }
    })

    this.setState({
      // clean selectedArea when adding a component
      selectedArea: null,
      filledArea,
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

  onDragEnterCanvas () {
    // clean selected area when dragging starts on canvas
    this.selectedArea = null
  }

  onDragLeaveCanvas () {
    // clean selected area (visually) when dragging outside canvas
    this.setState({
      selectedArea: null
    })
  }

  onDragEndCanvas () {
    // clean selected area (visually) when dragging ends
    this.setState({
      selectedArea: null
    })
  }

  onDropCanvas ({ item, col }) {
    if (this.selectedArea && this.selectedArea.filled && this.selectedArea.points && col) {
      this.addComponentToCanvas({
        componentType: item.name,
        componentTypeId: item.id,
        defaultSize: item.defaultSize,
        position: {
          top: this.selectedArea.points.top,
          left: this.selectedArea.points.left
        },
        colWidth: col.dimensions.width,
        colHeight: col.dimensions.height,
        props: item.props
      }, this.selectedArea.area)
    }
  }

  render () {
    const baseWidth = BASE_WIDTH

    const {
      components,
      gridRows,
      selectedArea,
      filledArea
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
            width={baseWidth}
            height={totalHeight}
            gridRows={gridRows}
            selectedArea={selectedArea}
            filledArea={filledArea}
            components={components}
            onDragEnter={this.onDragEnterCanvas}
            onDragLeave={this.onDragLeaveCanvas}
            onDragEnd={this.onDragEndCanvas}
            onDrop={this.onDropCanvas}
            onColDragOver={this.getSelectedAreaFromCol}
          />
        </div>
      </div>
    )
  }
}

export default Preview
