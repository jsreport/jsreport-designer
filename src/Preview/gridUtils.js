import arrayFrom from 'array.from'

function isInsideOfCol (point, colInfo) {
  const { x, y } = point
  const { width, height, top, left } = colInfo

  const result = (
    (left <= x && x <= (left + width)) &&
    (top <= y && y <= (top + height))
  )

  return result
}

function findStartCol (point, baseCol, { step, limit }) {
  let complete = false
  let filled = false
  let currentCol = { ...baseCol }
  let startCol
  let propertyToEvaluate

  if (point.side === 'top' || point.side === 'bottom') {
    propertyToEvaluate = 'row'
  } else {
    propertyToEvaluate = 'col'
  }

  while (!complete) {
    let isInside = isInsideOfCol(point, currentCol)

    if (isInside) {
      filled = true
    }

    if (currentCol[propertyToEvaluate] === limit || isInside) {
      startCol = {
        col: currentCol.col,
        row: currentCol.row
      }

      complete = true

      continue
    }

    // calculating next col to check
    currentCol[propertyToEvaluate] = currentCol[propertyToEvaluate] + step

    if (propertyToEvaluate === 'row') {
      currentCol.top = currentCol.top + (currentCol.height * step)
    } else {
      currentCol.left = currentCol.left + (currentCol.width * step)
    }
  }

  return {
    colCoordinate: startCol,
    filled
  }
}

const findFilledArea = (projectedLimits, startColInfo, { colsCount, rowsCount }) => {
  let area = {}
  let filled = false

  let foundInTop = findStartCol(
    { ...projectedLimits.top, side: 'top' },
    startColInfo,
    { step: -1, limit: 0 }
  )

  let foundInBottom = findStartCol(
    { ...projectedLimits.bottom, side: 'bottom' },
    startColInfo,
    { step: 1, limit: rowsCount - 1 }
  )

  let foundInLeft = findStartCol(
    { ...projectedLimits.left, side: 'left' },
    startColInfo,
    { step: -1, limit: 0 }
  )

  let foundInRight = findStartCol(
    { ...projectedLimits.right, side: 'right' },
    startColInfo,
    { step: 1, limit: colsCount - 1 }
  )

  // does the projected preview fills inside the selected area of grid?
  filled = (
    foundInTop.filled && foundInBottom.filled &&
    foundInLeft.filled && foundInRight.filled
  )

  let startX = foundInLeft.colCoordinate.col
  let endX = foundInRight.colCoordinate.col
  let startY = foundInTop.colCoordinate.row
  let endY = foundInBottom.colCoordinate.row
  let toFill = arrayFrom({ length: (endX - startX) + 1 }, (v, i) => startX + i)

  toFill.forEach((x) => {
    let currentY = startY

    while (currentY <= endY) {
      let coordinate = x + ',' + currentY

      if (area[coordinate]) {
        currentY++
        continue;
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
export { findStartCol }
export { findFilledArea }
