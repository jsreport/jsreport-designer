
function isDefault (exprResolution) {
  return (
    exprResolution === '$default' ||
    (Array.isArray(exprResolution) && exprResolution.length === 1 && exprResolution[0] === '$default')
  )
}

function getExpression (expressionsMap, exprResolution) {
  if (expressionsMap == null) {
    return undefined
  }

  if (isDefault(exprResolution)) {
    return expressionsMap.$default
  } else {
    return expressionsMap[exprResolution]
  }
}

module.exports = {
  isDefault,
  getExpression
}
