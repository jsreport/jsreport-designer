import arrayFrom from 'array.from'

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
    }

    if (current.col !== toCol.col) {
      if (nextCol < toCol.col) {
        current.distanceX += rows[originalRow].cols[originalCol + stepX].width * stepX
      }

      current.col += stepX
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

function findProjectedFilledArea ({ rows, filledArea, projectedLimits, baseColInfo }) {
  let area = {}
  let filled = false
  let conflict = false

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

  // does the projected preview fills inside the selected area of grid?
  filled = (
    foundInTop.filled && foundInBottom.filled &&
    foundInLeft.filled && foundInRight.filled
  )

  let startX = foundInLeft.colCoordinate.col
  let endX = foundInRight.colCoordinate.col
  let startY = foundInTop.colCoordinate.row
  let endY = foundInBottom.colCoordinate.row
  let filledRows = (endY - startY) + 1
  let filledCols = (endX - startX) + 1
  let toFill = arrayFrom({ length: filledCols }, (v, i) => startX + i)

  toFill.forEach((x) => {
    let currentY = startY

    while (currentY <= endY) {
      let coordinate = x + ',' + currentY

      if (area[coordinate]) {
        currentY++
        continue;
      }

      if (!conflict && filledArea && filledArea[coordinate]) {
        conflict = true
      }

      area[coordinate] = {
        col: x,
        row: currentY
      }

      currentY++
    }
  })

  return {
    filled,
    conflict,
    filledRows,
    filledCols,
    area,
    points: {
      top: foundInTop.colCoordinate,
      left: foundInLeft.colCoordinate,
      right: foundInRight.colCoordinate,
      bottom: foundInBottom.colCoordinate
    }
  }
}

export { isInsideOfCol }
export { getCenterPointBetweenCols }
export { getProjectedOffsetLimits }
export { getDistanceFromCol }
export { findStartCol }
export { findProjectedFilledArea }
