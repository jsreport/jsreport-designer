import arrayFrom from 'array.from'
import shortid from 'shortid'

const DEFAULT_LAYOUT_MODE = 'grid'

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

function findProjectedFilledArea ({ rows, baseColInfo, consumedRows, consumedCols }) {
  let area = {}
  let savedRows = []
  let filled = false
  let conflict = false
  let areaTotalWidth = 0
  let areaTotalHeigth = 0
  let areaBox
  let startCol
  let startRow
  let endCol
  let endRow
  let toFill

  startCol = baseColInfo.col
  startRow = baseColInfo.row

  endCol = baseColInfo.col + (consumedCols - 1)
  endCol = endCol < rows[startRow].cols.length ? endCol : rows[startRow].cols.length - 1

  endRow = baseColInfo.row + (consumedRows - 1)
  endRow = endRow < rows.length ? endRow : rows.length - 1

  toFill = arrayFrom({ length: (endCol - startCol) + 1 }, (v, i) => startCol + i)

  toFill.forEach((x) => {
    let currentRow = startRow

    areaTotalWidth += rows[currentRow].cols[x].width

    while (currentRow <= endRow) {
      let currentCol = rows[currentRow].cols[x]
      let coordinate = x + ',' + currentRow

      if (area[coordinate]) {
        currentRow++
        continue;
      }

      if (!conflict && !currentCol.empty) {
        conflict = true
      }

      area[coordinate] = {
        col: x,
        row: currentRow
      }

      if (savedRows.indexOf(currentRow) === -1) {
        areaTotalHeigth += rows[currentRow].height
        savedRows.push(currentRow)
      }

      currentRow++
    }
  })

  areaBox = {
    width: areaTotalWidth,
    height: areaTotalHeigth,
    top: baseColInfo.top,
    left: baseColInfo.left
  }

  // does the projected preview fills inside the selected area of grid?
  filled = (
    rows[baseColInfo.row].cols.length - baseColInfo.col >= consumedCols
  )

  return {
    filled,
    conflict,
    row: baseColInfo.row,
    startCol: baseColInfo.col,
    endCol: endCol,
    areaBox
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
      }),
      layoutMode: DEFAULT_LAYOUT_MODE
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
  const { row: startRow, startCol, endCol } = selectedArea

  let endRow = startRow
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

  // updating consumed cols in rowToUpdate
  for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
    if (rowToUpdate.cols[colIndex].empty) {
      rowToUpdate.cols[colIndex] = {
        ...rowToUpdate.cols[colIndex],
        empty: false
      }
    }
  }

  // if start row is a placeholder then update it to a normal row,
  // later we will change add a new row as the new placeholder
  if (rowToUpdate.placeholder) {
    delete rowToUpdate.placeholder
  }

  colToUpdateInfo = {
    // take the information from the starting points (selected area)
    // always take the col from the starting points
    row: startRow,
    col: startCol,
    height: rows[startRow].height,
    width: rows[startRow].cols[startCol].width,
    left: colDimensions.left,
    top: colDimensions.top
  }

  if (rows[startRow].empty) {
    rowToUpdateWillChangeDimensions = rows[startRow].height !== item.size.height
  } else {
    rowToUpdateWillChangeDimensions = item.size.height > rows[startRow].height
  }

  // if item will change the height of the row
  // then we should update the row information (size, etc) with new values,
  // the rule is that projected row will always take the height of the item when
  // it is greater than its own height.
  if (rowToUpdateWillChangeDimensions) {
    // new height of row is equal to the height of dropped item
    rowToUpdate.height = item.size.height
    // since rows will change, we need to update
    // some information of the col.
    // new height of col
    colToUpdateInfo.height = rowToUpdate.height
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
      empty: true,
      layoutMode: DEFAULT_LAYOUT_MODE
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

function generateDesignItem ({ row, startCol, endCol, components = [] }) {
  return {
    id: shortid.generate(),
    start: startCol,
    end: endCol,
    space: row.layoutMode === 'grid' ? (endCol - startCol) + 1 : (
      row.cols.slice(startCol, endCol + 1).reduce((acu, col) => {
        return acu + col.width
      }, 0)
    ),
    components: components
  }
}

function addOrUpdateDesignGroup (component, {
  rows,
  rowsToGroups,
  designGroups,
  referenceRow,
  fromCol
}) {
  let compProps = component.props || {}
  let currentGroup
  let newComponent
  let newDesignGroups
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
    let newItem
    let rowsToGroupsIndexes
    let rowGroupBeforeNewIndex
    let rowGroupAfterNewIndex
    let groupAfterNewIndex
    let topSpaceBeforeGroup
    let leftSpaceBeforeItem

    newItem = generateDesignItem({
      row: rows[referenceRow],
      startCol: fromCol.start,
      endCol: fromCol.end,
      components: [newComponent]
    })

    if (rows[referenceRow].layoutMode === 'grid') {
      leftSpaceBeforeItem = fromCol.start
    } else {
      leftSpaceBeforeItem = getDistanceFromCol({
        rows,
        fromCol: { row: referenceRow, col: 0 },
        toCol: { row: referenceRow, col: fromCol.start },
        opts: { includeFrom: fromCol.start !== 0 }
      }).distanceX
    }

    if (leftSpaceBeforeItem > 0) {
      newItem.leftSpace = leftSpaceBeforeItem
    }

    // creating a new group with component
    currentGroup = {
      id: shortid.generate(),
      items: [newItem],
      layoutMode: rows[referenceRow].layoutMode
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
      newDesignGroups = [
        ...designGroups,
        currentGroup
      ]

      // updating rows-groups map
      newRowsToGroup[referenceRow] = newDesignGroups.length - 1
    } else {
      let rowGroupsChanged = []

      // updating group order with the new group
      newDesignGroups = [
        ...designGroups.slice(0, groupAfterNewIndex),
        currentGroup,
        // updating top space of group after the new one
        ...designGroups.slice(groupAfterNewIndex, groupAfterNewIndex + 1).map((group) => {
          let newTopSpace = getDistanceFromCol({
            rows,
            fromCol: { row: referenceRow, col: 0 },
            toCol: { row: rowGroupAfterNewIndex, col: 0 }
          }).distanceY

          // updating top space only if necessary
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
        ...designGroups.slice(groupAfterNewIndex + 1)
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
    let currentItem
    let itemBeforeNewIndex
    let itemAfterNewIndex
    let componentInExistingItemIndex

    // getting existing group
    currentGroup = designGroups[groupFoundIndex]

    // searching for a item after the new one
    currentGroup.items.forEach((item, index) => {
      if (
        componentInExistingItemIndex == null &&
        item.start <= fromCol.start &&
        item.end >= fromCol.start
      ) {
        // getting the index of the first item
        componentInExistingItemIndex = index
      }

      if (itemAfterNewIndex == null && fromCol.end < item.start) {
        // getting the index of the first item after
        itemAfterNewIndex = index
      }

      if (item.end < fromCol.start) {
        // getting the index of the last item before
        itemBeforeNewIndex = index
      }
    })

    if (componentInExistingItemIndex != null) {
      currentItem = currentGroup.items[componentInExistingItemIndex]

      // adding component to existing item
      currentItem = {
        ...currentItem,
        components: [
          ...currentItem.components,
          newComponent
        ]
      }
    } else {
      let leftSpaceBeforeItem

      // creating new item
      currentItem = generateDesignItem({
        row: rows[referenceRow],
        startCol: fromCol.start,
        endCol: fromCol.end,
        components: [newComponent]
      })

      if (itemBeforeNewIndex != null) {
        if (rows[referenceRow].layoutMode === 'grid') {
          leftSpaceBeforeItem = (fromCol.start - currentGroup.items[itemBeforeNewIndex].end) - 1
        } else {
          leftSpaceBeforeItem = getDistanceFromCol({
            rows,
            fromCol: { row: referenceRow, col: currentGroup.items[itemBeforeNewIndex].end },
            toCol: { row: referenceRow, col: fromCol.start }
          }).distanceX
        }

        if (leftSpaceBeforeItem > 0) {
          currentItem.leftSpace = leftSpaceBeforeItem
        }
      }
    }

    if (componentInExistingItemIndex != null) {
      currentGroup.items = [
        ...currentGroup.items.slice(0, componentInExistingItemIndex),
        currentItem,
        ...currentGroup.items.slice(componentInExistingItemIndex + 1)
      ]
    } else {
      if (itemAfterNewIndex == null) {
        // if there is no item after the new item, insert it as the last
        currentGroup.items = [
          ...currentGroup.items,
          currentItem
        ]
      } else {
        // updating items order with the new item
        currentGroup.items = [
          ...currentGroup.items.slice(0, itemAfterNewIndex),
          currentItem,
          // updating left space of item after the new one
          ...currentGroup.items.slice(itemAfterNewIndex, itemAfterNewIndex + 1).map((item) => {
            let newLeftSpace

            if (rows[referenceRow].layoutMode === 'grid') {
              newLeftSpace = (item.start - fromCol.end) - 1
            } else {
              newLeftSpace = getDistanceFromCol({
                rows,
                fromCol: { row: referenceRow, col: fromCol.end },
                toCol: { row: referenceRow, col: item.start }
              }).distanceX
            }

            // updating left space if necessary
            if (
              (item.leftSpace == null && newLeftSpace !== 0) ||
              (item.leftSpace != null && item.leftSpace !== newLeftSpace)
            ) {
              return {
                ...item,
                leftSpace: newLeftSpace
              }
            }

            return item
          }),
          ...currentGroup.items.slice(itemAfterNewIndex + 1)
        ]
      }
    }

    newDesignGroups = [
      ...designGroups.slice(0, groupFoundIndex),
      currentGroup,
      ...designGroups.slice(groupFoundIndex + 1)
    ]
  }

  return {
    designGroups: newDesignGroups,
    rowsToGroups: newRowsToGroup
  }
}

/**
 *  Grid utils
 */
export { isInsideOfCol }
export { getDistanceFromCol }
export { findProjectedFilledArea }
export { generateRows }
export { generateCols }
export { updateRows }
/**
 *  Design group utils
 */
export { addOrUpdateDesignGroup }
