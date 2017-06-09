import arrayFrom from 'array.from'

function isInsideOfCol ({ point, colInfo }) {
  const { x, y } = point
  const { width, height, top, left } = colInfo

  const result = (
    (left <= x && x <= (left + width)) &&
    (top <= y && y <= (top + height))
  )

  return result
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
    let isInside = isInsideOfCol({ point, colInfo: currentCol })

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
        row: currentCol.row
      }

      complete = true

      continue
    }

    // calculating next col to check
    if (propertyToEvaluate === 'row') {
      currentCol.top = currentCol.top + (rows[currentCol.row + step].height * step)
    } else {
      currentCol.left = currentCol.left + (rows[currentCol.row].cols[currentCol.col + step].width * step)
    }

    currentCol[propertyToEvaluate] = currentCol[propertyToEvaluate] + step
  }

  return {
    colCoordinate: startCol,
    filled
  }
}

const findProjectedFilledArea = ({ rows, filledArea, projectedLimits, baseColInfo }) => {
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
  let toFill = arrayFrom({ length: (endX - startX) + 1 }, (v, i) => startX + i)

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
export { findProjectedFilledArea }
