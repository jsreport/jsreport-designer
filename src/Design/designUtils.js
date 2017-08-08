import arrayFrom from 'array.from'
import shortid from 'shortid'

const DEFAULT_LAYOUT_MODE = 'grid'

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
      if (Math.abs(nextRow - toCol.row)) {
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
      if (Math.abs(nextCol - toCol.col) >= 1) {
        current.distanceX += rows[originalRow].cols[originalCol + stepX].width * stepX
      }

      current.col += stepX

      // if next col has reached the limit and `includeTo` is activate then include
      // the values of the last col
      if (current.col === toCol.col && opts.includeTo === true) {
        current.distanceX += rows[originalRow].cols[current.col].width * stepX
      }
    }
  }

  return {
    distanceX: current.distanceX,
    distanceY: current.distanceY
  }
}

function areColsEmpty ({ row, fromCol, toCol, excludeTo }) {
  let step
  let colsToEvaluate
  let allEmpty

  if (fromCol === toCol || fromCol < toCol) {
    step = 1
  } else {
    step = -1
  }

  colsToEvaluate = arrayFrom({
    length: Math.abs(fromCol - toCol) + 1
  }, (v, i) => fromCol + (i * step))

  if (colsToEvaluate.length === 0) {
    return true
  }

  allEmpty = colsToEvaluate.every((col) => {
    if (excludeTo === true && col === toCol) {
      return true
    }

    return row.cols[col].empty === true
  })

  return allEmpty
}

function findProjectedFilledArea ({ rows, baseColInfo, consumedRows = 1, consumedCols }) {
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
      id: 'col-' + shortid.generate(),
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
      id: 'row-' + shortid.generate(),
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

    if (row.index === 1) {
      row.layoutMode = 'fixed'
    }

    rows.push(row)
  }

  return rows
}

function updateRows ({
  rows,
  previous,
  current,
  defaultRowHeight,
  defaultNumberOfCols,
  totalWidth,
  onRowIndexChange
}) {
  const {
    row: startRow,
    newHeight: newRowHeight,
    empty: emptyChange,
    startCol,
    endCol
  } = current

  let endRow = startRow
  let rowToUpdateWillChangeDimensions = false
  let rowsToAdd = []
  let rowToUpdate
  let rowsToUpdate
  let placeholderRow
  let newRows

  // get placeholder row (last one)
  placeholderRow = rows[rows.length - 1]

  rowToUpdate = {
    ...rows[startRow]
  }

  // updating current cols in rowToUpdate
  for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
    if (emptyChange != null && rowToUpdate.cols[colIndex].empty !== emptyChange) {
      rowToUpdate.cols[colIndex] = {
        ...rowToUpdate.cols[colIndex],
        empty: emptyChange
      }
    }
  }

  // if there is a change is "empty" state of cols we need to check if the row
  // is still empty or not
  if (emptyChange != null) {
    rowToUpdate.empty = rowToUpdate.cols.every((col) => col.empty)
  }

  if (rows[startRow].empty) {
    rowToUpdateWillChangeDimensions = rows[startRow].height !== newRowHeight
  } else {
    rowToUpdateWillChangeDimensions = newRowHeight > rows[startRow].height
  }

  // if the height of the row will be changed
  // then we should update the row information (size, etc) with new values,
  // the rule is that projected row will always take the height of the item when
  // it is greater than its own height.
  if (rowToUpdateWillChangeDimensions) {
    // new height of row is equal to the new height
    rowToUpdate.height = newRowHeight
  }

  // if placeholder row is inside the selected area then insert a new row
  if (endRow >= placeholderRow.index) {
    let newRow = {
      id: 'row-' + shortid.generate(),
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

    // if start row is a placeholder then update it to a normal row,
    // the new row will be the new placeholder
    if (rowToUpdate.placeholder) {
      delete rowToUpdate.placeholder
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

  // indexes of rows will be changed
  if (rowsToAdd.length > 0) {
    // removing empty rows inside the selected area of item
    // (rows that are present after the row to update)
    let filteredRowsToUpdate = rowsToUpdate.filter((currentRow) => {
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
  } else {
    newRows = newRows.concat(rowsToUpdate)
  }

  // changing the cols of previous row
  if (previous) {
    let previousRow = previous.row
    let previousStarCol = previous.startCol
    let previousEndCol = previous.endCol
    let previousEmptyChange = previous.empty
    let isRowEmpty
    let shouldUpdatePrevious
    let changedRow

    changedRow = {
      ...newRows[previousRow],
      cols: [
        ...newRows[previousRow].cols
      ]
    }

    for (let colIndex = previousStarCol; colIndex <= previousEndCol; colIndex++) {
      // change nothing is cols were updated previously
      if (
        emptyChange != null &&
        startRow === previousRow &&
        startCol <= colIndex &&
        colIndex <= endCol
      ) {
        continue;
      }

      if (
        changedRow.cols[colIndex].empty !== previousEmptyChange
      ) {
        shouldUpdatePrevious = true

        changedRow.cols[colIndex] = {
          ...changedRow.cols[colIndex],
          empty: previousEmptyChange
        }
      }
    }

    isRowEmpty = changedRow.cols.every((col) => col.empty)

    if (shouldUpdatePrevious) {
      changedRow.empty = isRowEmpty
      newRows[previousRow] = changedRow
    }
  }

  return {
    rows: newRows,
    updatedBaseRow: rowToUpdate
  }
}

function generateDesignItem ({ row, startCol, endCol, components = [], baseSize }) {
  let space
  let minSpace

  if (row.layoutMode === 'grid') {
    space = (endCol - startCol) + 1
    minSpace = space
  } else {
    space = row.cols.slice(startCol, endCol + 1).reduce((acu, col) => {
      return acu + col.width
    }, 0)

    minSpace = Math.ceil(baseSize.width)
  }

  return {
    id: 'DI-' + shortid.generate(),
    start: startCol,
    end: endCol,
    minSpace,
    space,
    components: components
  }
}

function addComponentToDesign (component, {
  rows,
  rowsToGroups,
  componentsInfo,
  componentSize,
  designGroups,
  referenceRow,
  fromCol
}) {
  let compProps = component.props || {}
  let currentGroup
  let newComponent
  let newDesignGroups
  let newRowsToGroups
  let newComponentsInfo
  let newComponentInfo = {}

  newRowsToGroups = {
    ...rowsToGroups
  }

  newComponentsInfo = {
    ...componentsInfo
  }

  // component information
  newComponent = {
    ...component,
    id: 'DC-' + shortid.generate(),
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
      components: [newComponent],
      baseSize: componentSize
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
      id: 'DG-' + shortid.generate(),
      items: [newItem],
      layoutMode: rows[referenceRow].layoutMode
    }

    newComponentInfo.rowIndex = referenceRow
    newComponentInfo.groupId = currentGroup.id
    newComponentInfo.itemId = newItem.id

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
      newRowsToGroups[referenceRow] = newDesignGroups.length - 1
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
        if (newRowsToGroups[row.index] != null) {
          rowGroupsChanged.push({ row: row.index })
          // deleting old references
          delete newRowsToGroups[row.index]
        }
      })

      rowGroupsChanged.forEach((changed) => {
        // adding + 1 to all groups after the new group
        newRowsToGroups[changed.row] = rowsToGroups[changed.row] + 1
      })

      // saving the new group
      newRowsToGroups[referenceRow] = groupAfterNewIndex
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
        components: [newComponent],
        baseSize: componentSize
      })

      if (rows[referenceRow].layoutMode === 'grid') {
        if (itemBeforeNewIndex != null) {
          leftSpaceBeforeItem = (fromCol.start - currentGroup.items[itemBeforeNewIndex].end) - 1
        } else {
          leftSpaceBeforeItem = fromCol.start
        }
      } else {
        if (itemBeforeNewIndex != null) {
          leftSpaceBeforeItem = getDistanceFromCol({
            rows,
            fromCol: { row: referenceRow, col: currentGroup.items[itemBeforeNewIndex].end },
            toCol: { row: referenceRow, col: fromCol.start }
          }).distanceX
        } else {
          leftSpaceBeforeItem = getDistanceFromCol({
            rows,
            fromCol: { row: referenceRow, col: 0 },
            toCol: { row: referenceRow, col: fromCol.start },
            opts: { includeFrom: fromCol.start !== 0 }
          }).distanceX
        }
      }

      if (leftSpaceBeforeItem > 0) {
        currentItem.leftSpace = leftSpaceBeforeItem
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

    newComponentInfo.rowIndex = referenceRow
    newComponentInfo.groupId = currentGroup.id
    newComponentInfo.itemId = currentItem.id

    newDesignGroups = [
      ...designGroups.slice(0, groupFoundIndex),
      currentGroup,
      ...designGroups.slice(groupFoundIndex + 1)
    ]
  }

  newComponentsInfo[newComponent.id] = newComponentInfo

  return {
    designGroups: newDesignGroups,
    newComponent,
    rowsToGroups: newRowsToGroups,
    componentsInfo: newComponentsInfo
  }
}

function updateDesignItem ({
  rowsToGroups,
  componentsInfo,
  designGroups,
  designItem,
  current
}) {
  let newDesignGroup
  let newDesignItem
  let nextDesignItem
  let designGroupIndex
  let designItemIndex

  designGroupIndex = rowsToGroups[componentsInfo[designItem.components[0].id].rowIndex]

  newDesignGroup = {
    ...designGroups[designGroupIndex]
  }

  if (designItem.index != null) {
    designItemIndex = designItem.index
  } else {
    let found

    newDesignGroup.items.some((item, idx) => {
      let ok = item.id === designItem.id

      if (ok) {
        found = idx
      }

      return ok
    })

    if (found != null) {
      designItemIndex = found
    }
  }

  newDesignItem = {
    ...newDesignGroup.items[designItemIndex]
  }

  nextDesignItem = newDesignGroup.items[designItemIndex + 1]

  if (newDesignGroup.layoutMode === 'grid') {
    newDesignItem.start = current.start
    newDesignItem.end = current.end
    newDesignItem.space = (current.end - current.start) + 1

    if (designItem.start !== current.start) {
      newDesignItem.leftSpace = designItem.leftSpace + (current.start - designItem.start)
    }
  }

  if (nextDesignItem) {
    if (designItem.end !== current.end) {
      nextDesignItem = { ...nextDesignItem }
      nextDesignItem.leftSpace = nextDesignItem.leftSpace + (designItem.end - current.end)
    }

    newDesignGroup.items = [
      ...newDesignGroup.items.slice(0, designItemIndex),
      newDesignItem,
      nextDesignItem,
      ...newDesignGroup.items.slice(designItemIndex + 2)
    ]
  } else {
    newDesignGroup.items = [
      ...newDesignGroup.items.slice(0, designItemIndex),
      newDesignItem,
      ...newDesignGroup.items.slice(designItemIndex + 1)
    ]
  }

  return [
    ...designGroups.slice(0, designGroupIndex),
    newDesignGroup,
    ...designGroups.slice(designGroupIndex + 1)
  ]
}

function selectComponentInDesign ({ componentId, componentsInfo }) {
  let found = componentsInfo[componentId] !== null
  let componentInGroupInfo

  if (!found) {
    return null
  }

  componentInGroupInfo = componentsInfo[componentId]

  return {
    group: componentInGroupInfo.groupId,
    data: {
      [componentInGroupInfo.groupId]: {
        item: componentInGroupInfo.itemId,
        data: {
          [componentInGroupInfo.itemId]: {
            component: componentId
          }
        }
      }
    }
  }
}

/**
 *  Grid utils
 */
export { findStartCol }
export { isInsideOfCol }
export { areColsEmpty }
export { getDistanceFromCol }
export { findProjectedFilledArea }
export { generateRows }
export { generateCols }
export { updateRows }
/**
 *  Design group utils
 */
export { addComponentToDesign }
export { updateDesignItem }
export { selectComponentInDesign }
