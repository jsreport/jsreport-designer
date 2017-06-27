import React, { Component } from 'react'
import memoize from 'lodash/memoize'
import {
  isInsideOfCol,
  getProjectedOffsetLimits,
  findProjectedFilledArea,
  generateRows,
  updateRows,
  addOrUpdateComponentGroup
} from './gridUtils'
import Canvas from './Canvas'
import './Design.css'

/*
  base width and base height depends on the target paper format
  A4 -> 980px width, with a factor of 1.414 aprox for height
*/
// values as constants for now
const BASE_WIDTH = 980
const DEFAULT_NUMBER_OF_ROWS = 7
const DEFAULT_NUMBER_OF_COLS = 12
const DEFAULT_ROW_HEIGHT = 78
const IS_DEV = true
let DevTools

if (IS_DEV) {
  DevTools = require('../DevTools').default
}

class Design extends Component {
  constructor (props) {
    super(props)

    let initialRows

    this.baseWidth = BASE_WIDTH
    this.defaultRowHeight = DEFAULT_ROW_HEIGHT
    this.defaultNumberOfRows = DEFAULT_NUMBER_OF_ROWS
    this.defaultNumberOfCols = DEFAULT_NUMBER_OF_COLS
    this.colWidth = this.baseWidth / this.defaultNumberOfCols
    this.totalHeightOfRows = null

    this.rowsToGroups = {}

    initialRows = generateRows({
      baseWidth: this.baseWidth,
      numberOfRows: this.defaultNumberOfRows,
      numberOfCols: this.defaultNumberOfCols,
      height: this.defaultRowHeight
    })

    // last row is placeholder
    if (initialRows.length > 0) {
      initialRows[initialRows.length - 1].placeholder = true
    }

    this.state = {
      components: [],
      selectedArea: null,
      gridRows: initialRows
    }

    this.totalHeightOfRows = this.getTotalHeightOfRows(this.state.gridRows)

    this.onDragEnterCanvas = this.onDragEnterCanvas.bind(this)
    this.onDragLeaveCanvas = this.onDragLeaveCanvas.bind(this)
    this.onDragEndCanvas = this.onDragEndCanvas.bind(this)

    // memoizing the calculation, only update when the cursor offset has changed
    this.calculateSelectedAreaFromCol = memoize(
      this.calculateSelectedAreaFromCol.bind(this),
      ({ clientOffset }) => {
        return clientOffset.x + ',' + clientOffset.y
      }
    )

    this.addComponentToCanvas = this.addComponentToCanvas.bind(this)
  }

  componentWillUpdate (nextProps, nextState) {
    // re-calculate computed value "totalHeightOfRows" if rows have changed
    if (this.state.gridRows !== nextState.gridRows) {
      this.totalHeightOfRows = this.getTotalHeightOfRows(nextState.gridRows)
    }
  }

  getTotalHeightOfRows (rows) {
    return rows.reduce((acu, row) => acu + row.height, 0)
  }

  calculateSelectedAreaFromCol ({ row, col, colDimensions, item, clientOffset }) {
    let rows = this.state.gridRows
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

    // TODO: update this logic, since rows can be of any size now this logic is wrong now
    maxFilledCols = Math.ceil(item.defaultSize.width / width)
    maxFilledRows = Math.ceil(item.defaultSize.height / height)

    projectedOffsetLimits = getProjectedOffsetLimits({
      cursorOffset: clientOffset,
      itemSize: item.defaultSize
    })

    // TODO: when dragging if some rows of the projected area of item is over some row that has
    // components then dropping should not be allowd there

    // TODO: calculate initial filled cols/rows limits
    // (if we should start to count for selected area from left/right/top/bottom
    // based on the orientation of the cursor to prevent placing items in
    // more cols/rows that they need to be)

    colCenter.x = left + (item.defaultSize.width / 2)
    colCenter.y = top + (item.defaultSize.height / 2)

    let isOnRightSide = (cursorOffsetX >= (colCenter.x + 2))
    let isOnBottomSide = (cursorOffsetY >= (colCenter.y + 2))

    let selectedArea = findProjectedFilledArea({
      rows,
      projectedLimits: projectedOffsetLimits,
      baseColInfo: colInfo
    })

    // saving selectedArea in instance because it will be reset later
    // and we want to access this value later
    this.selectedArea = selectedArea

    this.setState({
      selectedArea
    })
  }

  addComponentToCanvas ({ item, clientOffset, row, col, colDimensions }) {
    let shouldAddComponent = (
      this.selectedArea &&
      !this.selectedArea.conflict &&
      this.selectedArea.filled &&
      this.selectedArea.points &&
      col &&
      colDimensions
    )

    if (!shouldAddComponent) {
      return
    }

    let originalComponents = this.state.components
    let originalRowsToGroups = this.rowsToGroups || {}
    let currentRowsToGroups = { ...originalRowsToGroups }
    let changedRowsInsideGroups = []
    let centerInCurrentSelectedArea
    let newSelectedArea

    // TODO: Safari has a bug, if you drop a component and if that component causes the scroll bar to appear
    // then when you scroll the page you will see some part of the drag preview or some lines of the grid
    // getting draw randomly (a painting issue)
    // see: https://stackoverflow.com/questions/22842992/how-to-force-safari-to-repaint-positionfixed-elements-on-scroll

    // TODO: test calculation of selected area when dropping an item with height equal to row height
    // currently it doesn't select perfectly in one row items of same height
    // (maybe is it time to add something like snap to grid while dragging?)

    const {
      rows: newRows,
      updatedBaseRow,
      updateBaseColInfo
    } = updateRows({
      row,
      col,
      colDimensions,
      rows: this.state.gridRows,
      item,
      selectedArea: this.selectedArea,
      defaultRowHeight: this.defaultRowHeight,
      defaultNumberOfCols: this.defaultNumberOfCols,
      totalWidth: this.baseWidth,
      onRowIndexChange: (currentRow, newIndex) => {
        if (currentRowsToGroups[currentRow.index]) {
          changedRowsInsideGroups.push({ old: currentRow.index, new: newIndex })
          // deleting old references in rows-groups map
          delete currentRowsToGroups[currentRow.index]
        }
      }
    })

    // calculating center of current selected area
    centerInCurrentSelectedArea = {
      x: clientOffset.x,
      // since we are changing the row to match dropped item height
      // we need to pretend that the cursor is in center of the new row
      y: updateBaseColInfo.top + (updateBaseColInfo.height / 2)
    }

    // updating rows-groups map with the new row indexes
    changedRowsInsideGroups.forEach((changed) => {
      currentRowsToGroups[changed.new] = originalRowsToGroups[changed.old]
    })

    // calculate new filled area on new rows
    newSelectedArea = findProjectedFilledArea({
      rows: newRows,
      projectedLimits: getProjectedOffsetLimits({
        // get projected limits over center of current selected area
        cursorOffset: centerInCurrentSelectedArea,
        itemSize: item.defaultSize
      }),
      baseColInfo: updateBaseColInfo
    })

    if (!newSelectedArea.filled || newSelectedArea.conflict) {
      return
    }

    const { components, rowsToGroups } = addOrUpdateComponentGroup({
      componentType: item.name,
      componentTypeId: item.id,
      defaultSize: item.defaultSize,
      col: {
        start: newSelectedArea.points.left.col,
        end: newSelectedArea.points.right.col
      },
      props: item.props
    }, {
      rows: newRows,
      rowsToGroups: currentRowsToGroups,
      components: originalComponents,
      referenceRow: updatedBaseRow.index
    })

    // updating filled cols from groups information
    Object.keys(rowsToGroups).forEach((idx) => {
      let rowIndex = parseInt(idx, 10)
      let componentGroup = components[rowsToGroups[rowIndex]]

      componentGroup.group.forEach((comp) => {
        let col

        for (let x = comp.col.start; x <= comp.col.end; x++) {
          col = newRows[rowIndex].cols[x]

          if (col.empty) {
            newRows[rowIndex].cols[x] = {
              ...col,
              empty: false
            }
          }
        }
      })
    })

    this.rowsToGroups = rowsToGroups

    this.setState({
      // clean selectedArea when adding a component
      selectedArea: null,
      gridRows: newRows,
      components
    })
  }

  onDragEnterCanvas () {
    // clean selected area when dragging starts on canvas
    this.selectedArea = null
  }

  onDragLeaveCanvas () {
    if (this.state.selectedArea != null) {
      // clean selected area (visually) when dragging outside canvas (only when necessary)
      this.setState({
        selectedArea: null
      })
    }

  }

  onDragEndCanvas () {
    if (this.state.selectedArea != null) {
      // clean selected area (visually) when dragging ends (only when necessary)
      this.setState({
        selectedArea: null
      })
    }
  }

  render () {
    const baseWidth = this.baseWidth
    const colWidth = this.colWidth

    const {
      components,
      gridRows,
      selectedArea
    } = this.state

    // using computed value "totalHeightOfRows"
    let totalHeight = this.totalHeightOfRows
    let paddingLeftRight = 25

    return (
      <div className="Design-container">
        {DevTools && (
          <DevTools
            baseWidth={baseWidth}
            baseColWidth={colWidth}
            gridRows={gridRows}
            components={components}
          />
        )}
        <div
          className="Design-canvas"
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
            colWidth={colWidth}
            gridRows={gridRows}
            selectedArea={selectedArea}
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

export default Design
