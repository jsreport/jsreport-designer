
const styles = [
  'width',
  'height',
  'margin',
  'padding',
  'background',
  'fontSize',
  'textAlign',
  'color'
]

const stylesMap = {
  width: (value) => value != null ? `width: ${value.size}${value.unit};` : undefined,
  height: (value) => value != null ? `height: ${value.size}${value.unit};` : undefined,
  margin: (value) => {
    let result = []

    if (value == null) {
      return undefined
    }

    const marginValue = value.margin

    if (typeof marginValue !== 'object') {
      result.push(`margin: ${marginValue}${value.unit};`)
    } else {
      result.push(`margin-top: ${marginValue.top != null ? marginValue.top : 0}${value.unit};`)
      result.push(`margin-left: ${marginValue.left != null ? marginValue.left : 0}${value.unit};`)
      result.push(`margin-right: ${marginValue.right != null ? marginValue.right : 0}${value.unit};`)
      result.push(`margin-bottom: ${marginValue.bottom != null ? marginValue.bottom : 0}${value.unit};`)
    }

    return result.length > 0 ? result.join(' ') : undefined
  },
  padding: (value) => {
    let result = []

    if (value == null) {
      return undefined
    }

    const paddingValue = value.padding

    if (typeof paddingValue !== 'object') {
      result.push(`padding: ${paddingValue}${value.unit};`)
    } else {
      result.push(`padding-top: ${paddingValue.top != null ? paddingValue.top : 0}${value.unit};`)
      result.push(`padding-left: ${paddingValue.left != null ? paddingValue.left : 0}${value.unit};`)
      result.push(`padding-right: ${paddingValue.right != null ? paddingValue.right : 0}${value.unit};`)
      result.push(`padding-bottom: ${paddingValue.bottom != null ? paddingValue.bottom : 0}${value.unit};`)
    }

    return result.length > 0 ? result.join(' ') : undefined
  },
  background: (value) => {
    let result = []

    if (value == null) {
      return undefined
    }

    if (value.color != null) {
      let color = value.color

      result.push(
        `background-color: rgba(${color.r}, ${color.g}, ${color.b}, ${color.a});`
      )
    }

    return result.length > 0 ? result.join(' ') : undefined
  },
  fontSize: (value) => value != null ? `font-size: ${value.size}${value.unit};` : undefined,
  textAlign: (value) => `text-align: ${value};`,
  color: (value) => value != null ? `color: rgba(${value.r}, ${value.g}, ${value.b}, ${value.a});` : undefined
}

const resolver = (stylesList, stylesMap, styleValues) => {
  let result = []

  if (stylesList == null || stylesMap == null || styleValues == null) {
    return
  }

  stylesList.forEach((styleName) => {
    if (styleName == null) {
      return
    }

    if (stylesMap[styleName] == null || styleValues[styleName] == null) {
      return
    }

    const currentResolver = stylesMap[styleName]
    const currentStyleValue = styleValues[styleName]
    const styleOutput = currentResolver(currentStyleValue)

    if (styleOutput == null || styleOutput === '') {
      return
    }

    result.push(styleOutput)
  })

  result = result.join(' ')

  if (result === '') {
    return
  }

  return result
}

// control for each style is defined in designer UI configuration defaults

module.exports = {
  styles,
  stylesMap,
  resolver
}
