import React, { Component } from 'react'
import shortid from 'shortid'
import {
  isInsideOfCol,
  getProjectedOffsetLimits,
  getDistanceFromCol,
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

    this.rowsToGroups = {}

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
      filledArea,
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
    if (
      this.selectedArea &&
      !this.selectedArea.conflict &&
      this.selectedArea.filled &&
      this.selectedArea.points &&
      col &&
      colDimensions
    ) {
      const { area, points, filledCols, filledRows } = this.selectedArea

      let originalGridRows = this.state.gridRows
      let originalComponents = this.state.components
      let startRow = points.top.row
      let startCol = points.left.col
      let endRow = (startRow + filledRows) - 1
      let centerInCurrentSelectedArea = {}
      let originalRowsToGroups = this.rowsToGroups || {}
      let currentRowsToGroups = { ...originalRowsToGroups }
      let filledArea = {}
      let rowsChanged = []
      let gridRows
      let colToUpdateInfo
      let rowToUpdate
      let newSelectedArea

      // TODO: Safari has a bug, if you drop a component and if that component causes the scroll bar to appear
      // then when you scroll the page you will see some part of the drag preview or some lines of the grid
      // getting draw randomly (a painting issue)
      // see: https://stackoverflow.com/questions/22842992/how-to-force-safari-to-repaint-positionfixed-elements-on-scroll

      // TODO: test calculation of selected area when dropping an item with height equal to row height
      // currently it doesn't select perfectly in one row items of same height

      // TODO: decide how to add a new row when dropping
      // (maybe pass the rest of the space to create a other row)

      // TODO: add more rows when dropping something on the last row (placeholder row)
      // (maybe while dragging too, but it will feel weird, though)

      if (filledRows > 1 && item.defaultSize.height > originalGridRows[startRow].height) {
        // if item fills more than one row and its height is greater than projected row
        // then we should update the row information (size, etc) with new values,
        // the rule is that projected row will always take the height of the item when
        // it is greater than its own height
        rowToUpdate = {
          ...originalGridRows[startRow],
          // new height of row is equal to the height of dropped item
          height: item.defaultSize.height
        }
      }

      colToUpdateInfo = {
        // instead of taking the information (col, row, top, left, width, height) of the original col (dropped col),
        // we take the information of the starting points (projected area)
        // always take the col from the starting points
        row: startRow,
        col: startCol,
        height: originalGridRows[startRow].height,
        width: originalGridRows[startRow].cols[startCol].width,
        left: col.index === startCol ? colDimensions.left : colDimensions.left + getDistanceFromCol({
          rows: originalGridRows,
          fromCol: { row: row.index, col: col.index },
          toCol: { row: row.index, col: startCol },
          opts: { includeFrom: true }
        }).distanceX,
        top: row.index === startRow ? colDimensions.top : colDimensions.top + getDistanceFromCol({
          rows: originalGridRows,
          fromCol: { row: row.index, col: col.index },
          toCol: { row: startRow, col: col.index },
          opts: { includeFrom: true }
        }).distanceY
      }

      if (rowToUpdate) {
        // since rows will change, we need to update
        // some information of the col.
        // new height of col
        colToUpdateInfo.height = rowToUpdate.height
      }

      // calculating center of current selected area
      centerInCurrentSelectedArea = {
        x: clientOffset.x,
        // since we are changing the row to match dropped item height
        // we need to pretend that the cursor is in center of the new row
        y: colToUpdateInfo.top + (colToUpdateInfo.height / 2)
      }

      let rowsToAdd = []

      if (rowToUpdate) {
        rowsToAdd.push({
          index: rowToUpdate.index + 1,
          height: this.defaultRowHeight,
          unit: 'px',
          cols: this.getInitialGridCols({ 
            baseWidth: this.baseWidth,
            rowIndex: rowToUpdate.index + 1,
            numberOfCols: this.numberOfCols
          })
        })
      }

      gridRows = [
        ...originalGridRows.slice(0, rowToUpdate ? startRow : startRow + 1)
      ]

      if (rowToUpdate) {
        gridRows.push(rowToUpdate)
      }

      if (rowsToAdd.length) {
        gridRows = gridRows.concat(rowsToAdd)
      }

      gridRows = gridRows.concat(originalGridRows.slice(startRow + 1).map(function (currentRow) {
        let newIndex = currentRow.index + rowsToAdd.length

        // deleting old references in map
        if (currentRowsToGroups[currentRow.index] != null && currentRow.index !== newIndex) {
          rowsChanged.push({ old: currentRow.index, new: newIndex })
          delete currentRowsToGroups[currentRow.index]
        }

        currentRow.index = newIndex

        return currentRow
      }))

      // updating rows to groups map with the new row indexes
      rowsChanged.forEach((changed) => {
        currentRowsToGroups[changed.new] = originalRowsToGroups[changed.old]
      })

      // calculate new filled area on new rows
      newSelectedArea = findProjectedFilledArea({
        rows: gridRows,
        filledArea: null,
        projectedLimits: getProjectedOffsetLimits({
          // get projected limits over center of current selected area
          cursorOffset: centerInCurrentSelectedArea,
          itemSize: item.defaultSize
        }),
        baseColInfo: colToUpdateInfo
      })

      if (!newSelectedArea.filled || newSelectedArea.conflict) {
        return
      }

      let { components, rowsToGroups } = this.addOrUpdateComponentGroup({
        rows: gridRows,
        rowsToGroups: currentRowsToGroups,
        components: originalComponents,
        referenceRow: rowToUpdate ? rowToUpdate.index : startRow
      }, {
        componentType: item.name,
        componentTypeId: item.id,
        defaultSize: item.defaultSize,
        col: {
          start: newSelectedArea.points.left.col,
          end: newSelectedArea.points.right.col
        },
        props: item.props
      })

      // getting filled area from components
      Object.keys(rowsToGroups).forEach((idx) => {
        let rowIndex = parseInt(idx, 10)
        let componentGroup = components[rowsToGroups[rowIndex]]

        filledArea = componentGroup.group.reduce((area, comp) => {
          for (let x = comp.col.start; x <= comp.col.end; x++) {
            area[x + ',' + rowIndex] = {
              row: rowIndex,
              col: x
            }
          }

          return area
        }, filledArea)
      })

      this.rowsToGroups = rowsToGroups

      this.setState({
        // clean selectedArea when adding a component
        selectedArea: null,
        filledArea,
        gridRows,
        components
      })
    }
  }

  addOrUpdateComponentGroup ({ rows, rowsToGroups, components, referenceRow }, component) {
    let compProps = component.props || {}
    let topSpaceBeforeGroup
    let currentGroup
    let newComponent
    let newComponents
    let newRowsToGroup

    newRowsToGroup = {
      ...rowsToGroups
    }

    // component information
    newComponent = {
      ...component,
      id: shortid.generate(),
      props: compProps
    }

    // check to see if we should create a new group or update an existing one
    if (rowsToGroups[referenceRow] == null) {
      let rowsToGroupsIndexes
      let rowGroupBeforeNewIndex
      let rowGroupAfterNewIndex
      let groupAfterNewIndex

      // creating a new group with component
      currentGroup = {
        id: shortid.generate(),
        group: [newComponent]
      }

      rowsToGroupsIndexes = Object.keys(rowsToGroups).map((item) => parseInt(item, 10))

      // searching for a group before the new one (sort descending)
      rowsToGroupsIndexes.slice(0).sort((a, b) => b - a).some((rowIndex) => {
        if (rowIndex < referenceRow) {
          rowGroupBeforeNewIndex = rowIndex
          return true
        }

        return false
      })

      // calculating top space before this new group
      topSpaceBeforeGroup = getDistanceFromCol({
        rows,
        fromCol: { row: rowGroupBeforeNewIndex != null ? rowGroupBeforeNewIndex: 0, col: 0 },
        toCol: { row: referenceRow, col: 0 },
        opts: { includeFrom: rowGroupBeforeNewIndex == null }
      }).distanceY

      if (topSpaceBeforeGroup != null && topSpaceBeforeGroup !== 0) {
        currentGroup.topSpace = topSpaceBeforeGroup
      }

      // searching for a group after the new one (sort ascending)
      rowsToGroupsIndexes.slice(0).sort((a, b) => a - b).some((rowIndex) => {
        if (referenceRow < rowIndex) {
          rowGroupAfterNewIndex = rowIndex
          groupAfterNewIndex = rowsToGroups[rowGroupAfterNewIndex]
          return true
        }

        return false
      })

      if (groupAfterNewIndex == null) {
        // if there is no group after the new group, insert it as the last
        newComponents = [
          ...components,
          currentGroup
        ]

        // updating rows-groups map
        newRowsToGroup[referenceRow] = newComponents.length - 1
      } else {
        let rowGroupsChanged = []

        // updating group order with the new group
        newComponents = [
          ...components.slice(0, groupAfterNewIndex),
          currentGroup,
          ...components.slice(groupAfterNewIndex, groupAfterNewIndex + 1).map((group) => {
            // updating top space of group after the new one
            group.topSpace = getDistanceFromCol({
              rows,
              fromCol: { row: referenceRow, col: 0 },
              toCol: { row: rowGroupAfterNewIndex, col: 0 }
            }).distanceY

            return group
          }),
          ...components.slice(groupAfterNewIndex + 1)
        ]

        // updating rows-groups map
        // since group order has changed,
        // we need to update all referenced items in the object map
        rows.slice(rowGroupAfterNewIndex).forEach((row) => {
          if (newRowsToGroup[row.index] != null) {
            rowGroupsChanged.push({ row: row.index })
            // deleting old references
            delete newRowsToGroup[row.index]
          }
        })

        rowGroupsChanged.forEach((changed) => {
          // adding + 1 to all groups after the new group
          newRowsToGroup[changed.row] = rowsToGroups[changed.row] + 1
        })

        // saving the new group
        newRowsToGroup[referenceRow] = groupAfterNewIndex
      }
    } else {
      let groupFoundIndex = rowsToGroups[referenceRow]
      let componentAfterNewIndex

      // getting existing group
      currentGroup = components[groupFoundIndex]

      // searching for a component after the new one
      currentGroup.group.some((comp, index) => {
        if (newComponent.col.end < comp.col.start) {
          componentAfterNewIndex = index
          return true
        }

        return false
      })

      if (componentAfterNewIndex == null) {
        // if there is no component after the new component, insert it as the last
        currentGroup.group = [
          ...currentGroup.group,
          newComponent
        ]
      } else {
        // updating components order with the new component
        currentGroup.group = [
          ...currentGroup.group.slice(0, componentAfterNewIndex),
          newComponent,
          ...currentGroup.group.slice(componentAfterNewIndex)
        ]
      }

      newComponents = [
        ...components.slice(0, groupFoundIndex),
        currentGroup,
        ...components.slice(groupFoundIndex + 1)
      ]
    }

    return {
      components: newComponents,
      rowsToGroups: newRowsToGroup
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
