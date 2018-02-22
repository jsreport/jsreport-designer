
const rootName = '$general'

const propsNames = [
  'block'
]

function getDefaultGeneralProps () {
  const defaultProps = {}

  if (Object.keys(defaultProps).length === 0) {
    return {}
  }

  return {
    [rootName]: defaultProps
  }
}

function getGeneralPropsMeta () {
  const generalProps = {
    block: {
      displayName: 'full space',
      allowsBinding: false
    }
  }

  return {
    [rootName]: {
      allowsBinding: false,
      properties: generalProps
    }
  }
}

function isGeneralProp (propName) {
  return propName === rootName
}

module.exports = {
  propsNames,
  generalPropName: rootName,
  getGeneralPropsMeta,
  getDefaultGeneralProps,
  isGeneralProp
}
