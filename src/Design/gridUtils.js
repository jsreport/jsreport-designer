import arrayFrom from 'array.from'
import shortid from 'shortid'

function isInsideOfCol ({ point, colInfo }) {
  const { x, y } = point
  const { width, height, top, left } = colInfo

  const isInsideX = (left <= x && x <= (left + width))

  const isInsideY = (top <= y && y <= (top + height))

  const isInside = isInsideX && isInsideY

  return {
    isInside,
    isInsideX,
    isInsideY
  }
}

function getProjectedOffsetLimits ({ cursorOffset, itemSize }) {
  // NOTE: this function assumes that cursorOffset is in
  // the middle (middle top and middle left) of the item, and based on that assumption it calculates
  // the limits
  const { x: cursorOffsetX, y: cursorOffsetY } = cursorOffset

  return {
    left: {
      x: cursorOffsetX - (itemSize.width / 2),
      y: cursorOffsetY
    },
    top: {
      x: cursorOffsetX,
      y: cursorOffsetY - (itemSize.height / 2)
    },
    right: {
      x: cursorOffsetX + (itemSize.width / 2),
      y: cursorOffsetY
    },
    bottom: {
      x: cursorOffsetX,
      y: cursorOffsetY + (itemSize.height / 2)
    }
  }
}

function getCenterPointBetweenCols ({ rows, fromCol, toCol }) {
  let minX = fromCol.left
  let minY = fromCol.top
  let { distanceX, distanceY } = getDistanceFromCol({ rows, fromCol, toCol })

  return {
    x: (minX + distanceX) / 2,
    y: (minY + distanceY) / 2
  }
}

function getDistanceFromCol ({ rows, fromCol, toCol, opts = {} }) {
  let current = {
    row: fromCol.row,
    col: fromCol.col,
    distanceX: 0,
    distanceY: 0
  }

  let stepX = fromCol.col <= toCol.col ? 1 : -1
  let stepY = fromCol.row <= toCol.row ? 1 : -1

  // if `includeFrom` is active include the values of the starting row/col
  if (opts.includeFrom === true) {
    current.distanceY = rows[fromCol.row].height * stepY
    current.distanceX = rows[fromCol.row].cols[fromCol.col].width * stepX
  }

  while (current.col !== toCol.col || current.row !== toCol.row) {
    let originalRow = current.row
    let originalCol = current.col
    let nextRow = originalRow + stepY
    let nextCol = originalCol + stepX

    if (current.row !== toCol.row) {
      if (nextRow < toCol.row) {
        current.distanceY += rows[originalRow + stepY].height * stepY
      }

      current.row += stepY

      // if next row has reached the limit and `includeTo` is activate then include
      // the values of the last row
      if (current.row === toCol.row && opts.includeTo === true) {
        current.distanceY += rows[current.row].height * stepY
      }
    }

    if (current.col !== toCol.col) {
      if (nextCol < toCol.col) {
        current.distanceX += rows[originalRow].cols[originalCol + stepX].width * stepX
      }

      current.col += stepX

      // if next col has reached the limit and `includeTo` is activate then include
      // the values of the last col
      if (current.col === toCol.col && opts.includeTo === true) {
        current.distanceX += rows[originalRow].cols[current.col] * stepX
      }
    }
  }

  return {
    distanceX: current.distanceX,
    distanceY: current.distanceY
  }
}

function findStartCol ({ rows, point, baseCol, step }) {
  let complete = false
  let filled = false
  let currentCol = { ...baseCol }
  let startCol
  let propertyToEvaluate
  let limit

  if (point.side === 'top' || point.side === 'left') {
    limit = 0
  }

  if (point.side === 'top' || point.side === 'bottom') {
    propertyToEvaluate = 'row'
  } else {
    propertyToEvaluate = 'col'
  }

  while (!complete) {
    let isInsideInfo = isInsideOfCol({ point, colInfo: currentCol })
    // we only care if the point is inside of the evaluated side
    let isInside = isInsideInfo[propertyToEvaluate === 'row' ? 'isInsideY' : 'isInsideX']

    if (isInside) {
      filled = true
    }

    if (limit == null) {
      if (propertyToEvaluate === 'row') {
        limit = rows.length - 1
      } else {
        limit = rows[currentCol.row].cols.length - 1
      }
    }

    if (currentCol[propertyToEvaluate] === limit || isInside) {
      startCol = {
        col: currentCol.col,
        row: currentCol.row,
        x: currentCol.left,
        y: currentCol.top
      }

      complete = true

      continue
    }

    // calculating next col to check
    if (propertyToEvaluate === 'row') {
      if (step < 0) {
        // when the step is negative we calculate based on previous row
        currentCol.top = currentCol.top + (rows[currentCol.row + step].height * step)
      } else {
        currentCol.top = currentCol.top + (rows[currentCol.row].height * step)
      }

      currentCol.height = rows[currentCol.row + step].height
    } else {
      if (step < 0) {
        // when the step is negative we calculate based on previous col
        currentCol.left = currentCol.left + (rows[currentCol.row].cols[currentCol.col + step].width * step)
      } else {
        currentCol.left = currentCol.left + (rows[currentCol.row].cols[currentCol.col].width * step)
      }

      currentCol.width = rows[currentCol.row].cols[currentCol.col + step].width
    }

    currentCol[propertyToEvaluate] = currentCol[propertyToEvaluate] + step
  }

  return {
    colCoordinate: startCol,
    filled
  }
}

function findProjectedFilledArea ({ rows, projectedLimits, baseColInfo }) {
  let area = {}
  let filled = false
  let conflict = false
  let areaTotalWidth = 0
  let areaTotalHeigth = 0
  let areaBox

  let foundInTop = findStartCol({
    rows,
    point: { ...projectedLimits.top, side: 'top' },
    baseCol: baseColInfo,
    step: -1
  })

  let foundInBottom = findStartCol({
    rows,
    point: { ...projectedLimits.bottom, side: 'bottom' },
    baseCol: baseColInfo,
    step: 1
  })

  let foundInLeft = findStartCol({
    rows,
    point: { ...projectedLimits.left, side: 'left' },
    baseCol: baseColInfo,
    step: -1
  })

  let foundInRight = findStartCol({
    rows,
    point: { ...projectedLimits.right, side: 'right' },
    baseCol: baseColInfo,
    step: 1
  })

  let startX = foundInLeft.colCoordinate.col
  let endX = foundInRight.colCoordinate.col
  let startY = foundInTop.colCoordinate.row
  let endY = foundInBottom.colCoordinate.row
  let filledRows = (endY - startY) + 1
  let filledCols = (endX - startX) + 1
  let toFill = arrayFrom({ length: filledCols }, (v, i) => startX + i)
  let savedRows = []

  toFill.forEach((x) => {
    let currentY = startY

    areaTotalWidth += rows[currentY].cols[x].width

    while (currentY <= endY) {
      let currentCol = rows[currentY].cols[x]
      let coordinate = x + ',' + currentY

      if (area[coordinate]) {
        currentY++
        continue;
      }

      if (!conflict && !currentCol.empty) {
        conflict = true
      }

      area[coordinate] = {
        col: x,
        row: currentY
      }

      if (savedRows.indexOf(currentY) === -1) {
        areaTotalHeigth += rows[currentY].height
        savedRows.push(currentY)
      }

      currentY++
    }
  })

  areaBox = {
    width: areaTotalWidth,
    height: areaTotalHeigth,
    top: foundInTop.colCoordinate.y,
    left: foundInLeft.colCoordinate.x
  }

  // does the projected preview fills inside the selected area of grid?
  filled = (
    foundInTop.filled && foundInBottom.filled &&
    foundInLeft.filled && foundInRight.filled
  )

  return {
    filled,
    conflict,
    filledRows,
    filledCols,
    area,
    areaBox,
    points: {
      top: foundInTop.colCoordinate,
      left: foundInLeft.colCoordinate,
      right: foundInRight.colCoordinate,
      bottom: foundInBottom.colCoordinate
    }
  }
}

function generateCols ({ baseWidth, numberOfCols }) {
  let cols = []

  for (let i = 0; i < numberOfCols; i++) {
    cols.push({
      id: shortid.generate(),
      index: i,
      width: baseWidth / numberOfCols,
      unit: 'px',
      empty: true
    })
  }

  return cols
}

function generateRows ({ baseWidth, numberOfRows, numberOfCols, height }) {
  let rows = []

  for (let i = 0; i < numberOfRows; i++) {
    let row = {
      id: shortid.generate(),
      index: i,
      height: height,
      unit: 'px',
      empty: true,
      cols: generateCols({
        baseWidth,
        numberOfCols
      })
    }

    rows.push(row)
  }

  return rows
}

function updateRows ({
  row,
  col,
  colDimensions,
  rows,
  item,
  selectedArea,
  defaultRowHeight,
  defaultNumberOfCols,
  totalWidth,
  onRowIndexChange
}) {
  const { points, filledRows } = selectedArea

  let startRow = points.top.row
  let startCol = points.left.col
  let endRow = (startRow + filledRows) - 1
  let rowToUpdateWillIncreaseDimensions = false
  let rowToUpdateWillDecreaseDimensions = false
  let rowToUpdateWillChangeDimensions = false
  let rowsToAdd = []
  let rowToUpdate
  let rowsToUpdate
  let filteredRowsToUpdate
  let placeholderRow
  let colToUpdateInfo
  let newRows

  // get placeholder row (last one)
  placeholderRow = rows[rows.length - 1]

  rowToUpdate = {
    ...rows[startRow],
    // since the row to update will have the dropped item, then the row is not empty anymore
    empty: false
  }

  // if start row is a placeholder then update it to a normal row,
  // later we will change add a new row as the new placeholder
  if (rowToUpdate.placeholder) {
    delete rowToUpdate.placeholder
  }

  colToUpdateInfo = {
    // instead of taking the information (col, row, top, left, width, height) of the original col (dropped col),
    // we take the information from the starting points (selected area)
    // always take the col from the starting points
    row: startRow,
    col: startCol,
    height: rows[startRow].height,
    width: rows[startRow].cols[startCol].width,
    left: col.index === startCol ? colDimensions.left : colDimensions.left + getDistanceFromCol({
      rows: rows,
      fromCol: { row: row.index, col: col.index },
      toCol: { row: row.index, col: startCol },
      opts: { includeFrom: true }
    }).distanceX,
    top: row.index === startRow ? colDimensions.top : colDimensions.top + getDistanceFromCol({
      rows: rows,
      fromCol: { row: row.index, col: col.index },
      toCol: { row: startRow, col: col.index },
      opts: { includeFrom: true }
    }).distanceY
  }

  rowToUpdateWillDecreaseDimensions = (
    filledRows === 1 &&
    rows[startRow].height > item.defaultSize.height &&
    rows[startRow].empty
  )

  rowToUpdateWillIncreaseDimensions = (
    filledRows > 1 &&
    item.defaultSize.height > rows[startRow].height
  )

  if (rowToUpdateWillIncreaseDimensions || rowToUpdateWillDecreaseDimensions) {
    // if item will change the height of the row
    // then we should update the row information (size, etc) with new values,
    // the rule is that projected row will always take the height of the item when
    // it is greater than its own height.
    rowToUpdateWillChangeDimensions = true
    // new height of row is equal to the height of dropped item
    rowToUpdate.height = item.defaultSize.height
  }

  if (rowToUpdateWillChangeDimensions) {
    // since rows will change, we need to update
    // some information of the col.
    // new height of col
    colToUpdateInfo.height = rowToUpdate.height
  }

  // if row will change its dimensions then add a new
  // row with the remaining space
  if (rowToUpdateWillChangeDimensions) {
    let newRowHeight = getDistanceFromCol({
      rows: rows,
      fromCol: { row: startRow, col: 0 },
      toCol: { row: endRow, col: 0 },
      opts: { includeFrom: true, includeTo: true }
    }).distanceY

    rowsToAdd.push({
      id: shortid.generate(),
      index: rowToUpdate.index + (rowsToAdd.length + 1),
      // height of new row is equal to the difference between
      // height of projected area and item's height
      height: newRowHeight - item.defaultSize.height,
      unit: 'px',
      cols: generateCols({ 
        baseWidth: totalWidth,
        numberOfCols: defaultNumberOfCols
      }),
      // the row to add is empty
      empty: true
    })
  }

  // if placeholder row is inside the selected area then insert a new row
  if (endRow >= placeholderRow.index) {
    let newRow = {
      id: shortid.generate(),
      index: rowToUpdate.index + (rowsToAdd.length + 1),
      height: defaultRowHeight,
      unit: 'px',
      cols: generateCols({ 
        baseWidth: totalWidth,
        numberOfCols: defaultNumberOfCols
      }),
      // the row to add is empty
      empty: true
    }

    // setting the new placeholder row
    if (placeholderRow.index === rowToUpdate.index) {
      newRow.placeholder = true
    }

    rowsToAdd.push(newRow)
  }

  // creating new rows
  newRows = [
    // preserving all rows before the row to update
    ...rows.slice(0, rowToUpdate.index),
    rowToUpdate
  ]

  // add all calculated new rows
  if (rowsToAdd.length) {
    newRows = newRows.concat(rowsToAdd)
  }

  // checking all rows after the row to update
  rowsToUpdate = rows.slice(rowToUpdate.index + 1)

  // removing empty rows inside the selected area of item
  // (rows that are present after the row to update)
  filteredRowsToUpdate = rowsToUpdate.filter((currentRow) => {
    // ignore placeholder row
    if (currentRow.placeholder) {
      return true
    }

    if (currentRow.empty && startRow <= currentRow.index && currentRow.index <= endRow) {
      return false
    }

    return true
  })

  newRows = newRows.concat(filteredRowsToUpdate.map((currentRow) => {
    // original index plus the amount of rows added
    let newIndex = currentRow.index + rowsToAdd.length

    // minus the amount of items eliminated in the filtering
    newIndex = newIndex - (rowsToUpdate.length - filteredRowsToUpdate.length)

    // index of row has changed
    if (currentRow.index !== newIndex) {
      onRowIndexChange && onRowIndexChange(currentRow, newIndex)
    }

    if (newIndex !== currentRow.index) {
      return {
        ...currentRow,
        index: newIndex
      }
    }

    return currentRow
  }))

  return {
    rows: newRows,
    updatedBaseRow: rowToUpdate,
    updateBaseColInfo: colToUpdateInfo
  }
}

function addOrUpdateComponentGroup (component, { rows, rowsToGroups, components, referenceRow }) {
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
      opts: { includeFrom: rowGroupBeforeNewIndex == null && referenceRow !== 0 ? true : false }
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
          let newTopSpace = getDistanceFromCol({
            rows,
            fromCol: { row: referenceRow, col: 0 },
            toCol: { row: rowGroupAfterNewIndex, col: 0 }
          }).distanceY

          // updating top space of group after the new one
          if (
            (group.topSpace == null && newTopSpace !== 0) ||
            (group.topSpace != null && group.topSpace !== newTopSpace)
          ) {
            return {
              ...group,
              topSpace: newTopSpace
            }
          }

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

/**
 *  Grid utils
 */
export { isInsideOfCol }
export { getCenterPointBetweenCols }
export { getProjectedOffsetLimits }
export { getDistanceFromCol }
export { findStartCol }
export { findProjectedFilledArea }
export { generateRows }
export { generateCols }
export { updateRows }
/**
 *  Component group utils
 */
export { addOrUpdateComponentGroup }
