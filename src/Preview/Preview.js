import React, { Component } from 'react'
import shortid from 'shortid'
import {
  isInsideOfCol,
  getProjectedOffsetLimits,
  findProjectedFilledArea
} from './gridUtils'
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

    this.baseWidth = BASE_WIDTH
    this.defaultRowHeight = DEFAULT_ROW_HEIGHT
    this.numberOfCols = NUMBER_OF_COLS
    this.colWidth = this.baseWidth / this.numberOfCols

    this.state = {
      components: [],
      gridRows: this.getInitialGridRows({
        baseWidth: this.baseWidth,
        numberOfCols: this.numberOfCols,
        defaultRowHeight: this.defaultRowHeight
      }),
      selectedArea: null,
      filledArea: null
    }

    this.onDragEnterCanvas = this.onDragEnterCanvas.bind(this)
    this.onDragLeaveCanvas = this.onDragLeaveCanvas.bind(this)
    this.onDragEndCanvas = this.onDragEndCanvas.bind(this)
    this.calculateSelectedAreaFromCol = this.calculateSelectedAreaFromCol.bind(this)
    this.addComponentToCanvas = this.addComponentToCanvas.bind(this)
  }

  getInitialGridRows ({ baseWidth, numberOfCols, defaultRowHeight }) {
    let rows = []
    let defaultNumberOfRows = 7

    for (let i = 0; i < defaultNumberOfRows; i++) {
      // last row is placeholder
      let isPlaceholder = (i === defaultNumberOfRows - 1)

      let row = {
        index: i,
        height: defaultRowHeight,
        unit: 'px',
        cols: this.getInitialGridCols({
          baseWidth,
          rowIndex: rows.length,
          numberOfCols
        })
      }

      if (isPlaceholder) {
        row.placeholder = true
      }

      rows.push(row)
    }

    return rows
  }

  getInitialGridCols ({ baseWidth, rowIndex, numberOfCols }) {
    let cols = []

    for (let i = 0; i < numberOfCols; i++) {
      cols.push({
        index: i,
        width: baseWidth / numberOfCols,
        unit: 'px'
      })
    }

    return cols
  }

  getTotalHeightOfRows (rows) {
    return rows.reduce((acu, row) => acu + row.height, 0)
  }

  addComponent (components, groupMeta, component) {
    let compProps = component.props || {}
    let item

    if (component.componentType === 'Text') {
      compProps = {
        ...compProps,
        text: 'Sample Text'
      }
    }

    item = {
      group: [{
        ...component,
        id: shortid.generate(),
        props: compProps
      }]
    }

    if (groupMeta.topSpace != null) {
      item.topSpace = groupMeta.topSpace
    }

    item.row = groupMeta.row

    return [
      ...components,
      item
    ]
  }

  calculateSelectedAreaFromCol ({ row, col, colDimensions, item, clientOffset }) {
    let rows = this.state.gridRows
    let filledArea = this.state.filledArea
    let isInside = true
    let { x: cursorOffsetX, y: cursorOffsetY } = clientOffset
    let { width, height, top, left } = colDimensions
    let colCenter = {}
    let maxFilledCols
    let maxFilledRows
    let projectedOffsetLimits

    let colInfo = {
      col: col.index,
      row: row.index,
      width,
      height,
      top,
      left
    }

    isInside = isInsideOfCol({
      point: { x: cursorOffsetX, y: cursorOffsetY },
      colInfo
    }).isInside

    if (!isInside) {
      return
    }

    maxFilledCols = Math.ceil(item.defaultSize.width / width)
    maxFilledRows = Math.ceil(item.defaultSize.height / height)

    projectedOffsetLimits = getProjectedOffsetLimits({
      cursorOffset: clientOffset,
      itemSize: item.defaultSize
    })

    // TODO: calculate limits/constraints
    // (if we should start to count for selected area from left/right/top/bottom
    // based on the orientation of the cursor to prevent placing items in
    // more cols/rows that they need to be)

    // TODO: test dragging while there is the scrollbar on viewport, just to see that
    // everything is behaving and placed correctly

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

    let selectedArea = findProjectedFilledArea({
      rows,
      filledArea,
      projectedLimits: projectedOffsetLimits,
      baseColInfo: colInfo
    })

    // console.log('SELECTED AREA:', selectedArea)

    // saving selectedArea in instance because it will be reset later
    // and we want to access this value later
    this.selectedArea = selectedArea

    this.setState({
      selectedArea
    })
  }

  addComponentToCanvas ({ item, clientOffset, col, colDimensions }) {
    if (
      this.selectedArea &&
      !this.selectedArea.conflict &&
      this.selectedArea.filled &&
      this.selectedArea.points &&
      col &&
      colDimensions
    ) {
      const { area, points, filledCols, filledRows } = this.selectedArea

      let filledArea = this.state.filledArea || {}
      let originalGridRows = this.state.gridRows
      let originalComponents = this.state.components
      let startRow = points.top.row
      let startCol = points.left.col
      let endRow = (startRow + filledRows) - 1
      let centerInCurrentSelectedArea = {}
      let groupMeta = {}
      // all drops will always merge rows to only one
      let newFilledRows = 1
      let gridRows
      let components
      let newColInfo
      let newRow
      let newSelectedArea
      let topSpaceBeforeGroup

      // TODO: test calculation of selected area when dropping in row with new height
      // currently it doesn't select perfectly in one row items of same height

      // TODO: when dropping (make the row take the size of item dropped,
      // it should always take the item with the greater size and apply it to the row)
      // test with creating a first group, then dropping a componente with more height inside
      // that group, the group must adapt to the new height

      // TODO: decide how to add a new row when dropping
      // (maybe pass the rest of the space to create a other row)

      // TODO: make more smart logic about row grouping and limits to not depend on row height
      // for position of components

      // TODO: write proper logic to calculate if there is some filled
      // handle cases like dropping component between two groups

      // TODO: add more rows when dropping something on the last row (placeholder row)
      // (maybe while dragging too, but it will feel weird, though)

      newRow = {
        ...originalGridRows[startRow],
        // new height of row is equal to the height of dropped item
        height: item.defaultSize.height
      }

      newColInfo = {
        col: col.index,
        width: colDimensions.width,
        left: colDimensions.left,
        // since rows will change, we need to update
        // the row index, top and height of the col
        row: startRow,
        top: colDimensions.top,
        height: colDimensions.height,
      }

      // new top of col
      newColInfo.top = points.top.y
      // new height of col
      newColInfo.height = newRow.height

      // calculating center of current selected area
      centerInCurrentSelectedArea = {
        x: clientOffset.x,
        // since we are changing the row to match dropped item height
        // we need to pretend that the cursor is in center of the new row
        y: points.top.y + (newColInfo.height / 2)
      }

      let rowsToAdd = [
        {
          index: newRow.index + 1,
          height: this.defaultRowHeight,
          unit: 'px',
          cols: this.getInitialGridCols({ 
            baseWidth: this.baseWidth,
            rowIndex: newRow.index + 1,
            numberOfCols: this.numberOfCols
          })
        }
      ]

      gridRows = [
        ...originalGridRows.slice(0, startRow),
        newRow,
        ...rowsToAdd,
        ...originalGridRows.slice(startRow + newFilledRows + rowsToAdd.length).map(function (row) {
          let newRowIndex = (row.index - (filledRows - 1)) + rowsToAdd.length

          row.index = newRowIndex

          return row
        })
      ]

      // calculate new filled area on new rows
      newSelectedArea = findProjectedFilledArea({
        rows: gridRows,
        filledArea: null,
        projectedLimits: getProjectedOffsetLimits({
          // get projected limits over center of current selected area
          cursorOffset: centerInCurrentSelectedArea,
          itemSize: item.defaultSize
        }),
        baseColInfo: newColInfo
      })

      if (!newSelectedArea.filled || newSelectedArea.conflict) {
        return
      }

      filledArea = {
        ...filledArea
      }

      Object.keys(newSelectedArea.area).forEach((coord) => {
        if (filledArea[coord] == null) {
          filledArea[coord] = newSelectedArea.area[coord]
        }
      })

      groupMeta.row = newRow.index

      topSpaceBeforeGroup = gridRows.slice(
        // take the next row after last group
        originalComponents.length > 0 ? originalComponents[originalComponents.length - 1].row + 1: 0,
        newSelectedArea.points.top.row
      ).reduce((acu, row) => {
        return acu + row.height
      }, 0)

      if (topSpaceBeforeGroup != null && topSpaceBeforeGroup !== 0) {
        groupMeta.topSpace = topSpaceBeforeGroup
      }

      components = this.addComponent(originalComponents, groupMeta, {
        componentType: item.name,
        componentTypeId: item.id,
        defaultSize: item.defaultSize,
        col: {
          start: newSelectedArea.points.left.col,
          end: newSelectedArea.points.right.col
        },
        props: item.props
      })

      this.setState({
        // clean selectedArea when adding a component
        selectedArea: null,
        filledArea,
        gridRows,
        components
      })
    }
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
            colWidth={this.colWidth}
            gridRows={gridRows}
            selectedArea={selectedArea}
            filledArea={filledArea}
            components={components}
            onDragEnter={this.onDragEnterCanvas}
            onDragLeave={this.onDragLeaveCanvas}
            onDragEnd={this.onDragEndCanvas}
            onDrop={this.addComponentToCanvas}
            onColDragOver={this.calculateSelectedAreaFromCol}
          />
        </div>
      </div>
    )
  }
}

export default Preview
