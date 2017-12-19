
function getExpression (expressionsMap, exprResolution) {
  if (expressionsMap == null) {
    return undefined
  }

  let expressionResolved

  if (
    Array.isArray(exprResolution) &&
    exprResolution.length === 1 &&
    typeof exprResolution[0] === 'string'
  ) {
    expressionResolved = {
      name: exprResolution[0],
      info: expressionsMap[exprResolution[0]]
    }
  } else if (
    !Array.isArray(exprResolution) &&
    typeof exprResolution === 'string'
  ) {
    return {
      name: exprResolution,
      info: expressionsMap[exprResolution]
    }
  } else if (Array.isArray(exprResolution)) {
    expressionResolved = []

    exprResolution.forEach((exprName) => {
      if (typeof exprName === 'string') {
        expressionResolved.push({
          name: exprName,
          info: expressionsMap[exprName]
        })
      }
    })

    if (expressionResolved.length === 0) {
      expressionResolved = undefined
    }
  }

  return expressionResolved
}

module.exports = {
  getExpression
}
