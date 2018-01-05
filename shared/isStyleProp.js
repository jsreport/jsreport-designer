
function isStyleProp (propMeta) {
  if (
    propMeta != null &&
    propMeta.styleProp === true
  ) {
    return true
  }

  return false
}

module.exports = isStyleProp
