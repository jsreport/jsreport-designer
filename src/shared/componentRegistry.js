
const assign = require('lodash/assign')
const get = require('lodash/get')
const Handlebars = require('handlebars')

// requiring inline just for now because we don't have any webpack setup yet
global.designComponents = {}
global.designComponents.Text = require('../shared/designComponents/Text')
global.designComponents.Image = require('../shared/designComponents/Image')
global.designComponents.Table = require('../shared/designComponents/Table')

let componentsDefinition = {}
let components = {}

function isObject (value) {
  return typeof value === 'object' && !Array.isArray(value)
}

function compileTemplate (template) {
  return Handlebars.compile(template)
}

function getComponentsDefinition () {
  return Object.keys(componentsDefinition).map((componentType) => {
    return componentsDefinition[componentType]
  })
}

function getComponentDefinitionFromType (type) {
  return componentsDefinition[type]
}

function loadComponents (_componentsToLoad) {
  let componentsToLoad = Array.isArray(_componentsToLoad) ? _componentsToLoad : getComponentsDefinition()

  let componentRequires = componentsToLoad.map((component) => {
    // little dumb condition for now
    let isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    let originalExportValue
    let componentTemplate
    let compiledTemplate
    let helpersInTemplate
    let exportValue

    if (getComponentFromType(component.name) != null) {
      // component type is already registered don't try to load it again
      return undefined
    }

    originalExportValue = isBrowser ? global.designComponents[component.name] : (component.location ? require(component.location) : undefined)

    // just for now if the component has no source set a default component,
    // this should probably just throw an error later
    if (!originalExportValue) {
      originalExportValue = {
        getDefaultProps: () => {
          return {}
        },
        template: () => {
          return '<div>Default empty component</div>'
        },
        helpers: () => {
          return {}
        }
      }
    }

    componentTemplate = originalExportValue.template()

    compiledTemplate = compileTemplate(componentTemplate)

    if (typeof originalExportValue.helpers === 'function') {
      helpersInTemplate = originalExportValue.helpers()
    } else {
      helpersInTemplate = {}
    }

    exportValue = assign({}, originalExportValue, {
      helpers: () => {
        if (typeof originalExportValue.helpers === 'function') {
          return originalExportValue.helpers()
        }

        return {}
      },
      render: ({ props, bindings, customCompiledTemplate, data }) => {
        let newProps = assign({}, props)
        let result = {}
        let componentHelpers

        // checking for binded props
        if (isObject(bindings)) {
          Object.keys(bindings).forEach((propName) => {
            let isLazyBinding = propName[0] === '@'
            let currentBinding

            if (isLazyBinding) {
              return
            }

            currentBinding = bindings[propName]

            if (!isObject(currentBinding)) {
              return
            }

            if (isObject(currentBinding.richContent)) {
              // resolving rich content
              newProps[propName] = new Handlebars.SafeString(currentBinding.richContent.html)
            } else if (isObject(currentBinding.defaultExpression)) {
              if (Array.isArray(currentBinding.defaultExpression.value)) {
                // resolving direct data binding
                newProps[propName] = resolveBindingExpression(currentBinding.defaultExpression.value, data)
              }
            }
          })
        }

        result.props = newProps

        componentHelpers = assign({
          resolveBinding: (bindingName, context, options) => {
            let expression
            let currentContext

            if (context == null || options == null) {
              return null
            }

            if (context === '/') {
              currentContext = data
            } else {
              currentContext = context
            }

            if (isObject(bindings) && bindings[bindingName] != null) {
              expression = bindings[bindingName].defaultExpression.value
            }

            if (!expression) {
              return undefined
            }

            return resolveBindingExpression(expression, currentContext)
          }
        }, helpersInTemplate)

        if (customCompiledTemplate) {
          result.content = customCompiledTemplate(newProps, {
            helpers: componentHelpers
          })
        } else {
          result.content = compiledTemplate(newProps, {
            helpers: componentHelpers
          })
        }

        return result
      }
    })

    componentsDefinition[component.name] = componentsDefinition[component.name] || component
    components[component.name] = exportValue

    return component.name
  })

  return componentRequires
}

function resolveBindingExpression (expression, context) {
  let FIELD_TYPE = {
    property: 'p',
    index: 'i'
  }

  let currentContext = context
  let result

  if (context == null) {
    return undefined
  }

  for (let i = 0; i < expression.length; i++) {
    let currentExpression = expression[i]
    let keySeparatorAt
    let fieldType
    let key

    if (currentExpression === '') {
      result = context
      break;
    }

    keySeparatorAt = currentExpression.indexOf(':')


    if (keySeparatorAt === -1) {
      result = undefined
      break;
    }

    fieldType = currentExpression.slice(0, keySeparatorAt)
    key = currentExpression.slice(keySeparatorAt + 1)

    if (key === '') {
      result = undefined
      break;
    }

    if (Array.isArray(currentContext) && fieldType === FIELD_TYPE.property) {
      result = undefined
      break;
    }

    result = get(currentContext, key, undefined)

    if (result === undefined) {
      break;
    }

    currentContext = result
  }

  return result
}

function registerComponent (name, definition) {
  componentsDefinition[name] = assign({ name: name }, definition)
}

function getComponentFromType (type) {
  var comp = components[type]

  if (comp) {
    return comp
  }

  return
}

module.exports.loadComponents = loadComponents
module.exports.registerComponent = registerComponent
module.exports.getComponentsDefinition = getComponentsDefinition
module.exports.getComponentDefinitionFromType = getComponentDefinitionFromType
module.exports.getComponentFromType = getComponentFromType
module.exports.compileTemplate = compileTemplate
