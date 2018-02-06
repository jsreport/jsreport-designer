
const createError = (propName, componentName) => new Error(
  'Invalid prop `' + propName + '` supplied to' +
  ' `' + componentName + '`, must be a HTML node element. Validation failed.'
)

const htmlElementPropType = (optional = false) => {
  return (props, propName, componentName) => {
    const nodeProp = props[propName]
    const isElement = nodeProp instanceof HTMLElement

    if (optional === true && nodeProp == null) {
      return
    }

    if (!isElement) {
      return createError(propName, componentName)
    }
  }
}

export default htmlElementPropType
