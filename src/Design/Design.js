import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import memoize from 'lodash/memoize'
import {
  isInsideOfCol,
  findProjectedFilledArea,
  generateRows,
  updateRows,
  addOrUpdateDesignGroup
} from './designUtils'
import Canvas from './Canvas'
import './Design.css'

const IS_DEV = true

let DevTools

if (IS_DEV) {
  DevTools = require('../DevTools').default
}

class Design extends PureComponent {
  constructor (props) {
    super(props)

    let {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfRows,
      defaultNumberOfCols
    } = this.props

    let initialRows

    this.totalHeightOfRows = null

    this.rowsToGroups = {}

    initialRows = generateRows({
      baseWidth: baseWidth,
      numberOfRows: defaultNumberOfRows,
      numberOfCols: defaultNumberOfCols,
      height: defaultRowHeight
    })

    // last row is placeholder
    if (initialRows.length > 0) {
      initialRows[initialRows.length - 1].placeholder = true
    }

    this.state = {
      designGroups: [],
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

    let selectedArea = findProjectedFilledArea({
      rows,
      baseColInfo: colInfo,
      consumedRows: item.consumedRows,
      consumedCols: item.consumedCols
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
      col &&
      colDimensions
    )

    if (!shouldAddComponent) {
      return
    }

    let {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfCols
    } = this.props

    let originalDesignGroups = this.state.designGroups
    let selectedArea = this.selectedArea
    let originalRowsToGroups = this.rowsToGroups || {}
    let currentRowsToGroups = { ...originalRowsToGroups }
    let changedRowsInsideGroups = []

    // TODO: Safari has a bug, if you drop a component and if that component causes the scroll bar to appear
    // then when you scroll the page you will see some part of the drag preview or some lines of the grid
    // getting draw randomly (a painting issue)
    // see: https://stackoverflow.com/questions/22842992/how-to-force-safari-to-repaint-positionfixed-elements-on-scroll
    const {
      rows: newRows,
      updatedBaseRow
    } = updateRows({
      row,
      col,
      colDimensions,
      rows: this.state.gridRows,
      item,
      selectedArea: this.selectedArea,
      defaultRowHeight: defaultRowHeight,
      defaultNumberOfCols: defaultNumberOfCols,
      totalWidth: baseWidth,
      onRowIndexChange: (currentRow, newIndex) => {
        if (currentRowsToGroups[currentRow.index]) {
          changedRowsInsideGroups.push({ old: currentRow.index, new: newIndex })
          // deleting old references in rows-groups map
          delete currentRowsToGroups[currentRow.index]
        }
      }
    })

    // updating rows-groups map with the new row indexes
    changedRowsInsideGroups.forEach((changed) => {
      currentRowsToGroups[changed.new] = originalRowsToGroups[changed.old]
    })

    const { designGroups, rowsToGroups } = addOrUpdateDesignGroup({
      type: item.name,
      props: item.props
    }, {
      rows: newRows,
      rowsToGroups: currentRowsToGroups,
      designGroups: originalDesignGroups,
      referenceRow: updatedBaseRow.index,
      fromCol: {
        start: selectedArea.startCol,
        end: selectedArea.endCol
      }
    })

    this.rowsToGroups = rowsToGroups

    this.setState({
      // clean selectedArea when adding a component
      selectedArea: null,
      gridRows: newRows,
      designGroups
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
    const {
      baseWidth,
      defaultNumberOfCols
    } = this.props

    const {
      designGroups,
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
            numberOfCols={defaultNumberOfCols}
            gridRows={gridRows}
            designGroups={designGroups}
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
            numberOfCols={defaultNumberOfCols}
            gridRows={gridRows}
            selectedArea={selectedArea}
            designGroups={designGroups}
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

Design.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  defaultRowHeight: PropTypes.number.isRequired,
  defaultNumberOfRows: PropTypes.number.isRequired,
  defaultNumberOfCols: PropTypes.number.isRequired
}

export default Design
