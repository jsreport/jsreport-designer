
const get = require('lodash/get')
const Handlebars = require('handlebars')

let componentsDefinition = {}
let components = {}

function isObject (value) {
  return typeof value === 'object' && !Array.isArray(value)
}

function getComponentsDefinition () {
  return componentsDefinition
}

function getComponentDefinition (type) {
  return componentsDefinition[type]
}

function getComponents () {
  return components
}

function getComponent (type) {
  return components[type]
}

function compileTemplate (template) {
  return Handlebars.compile(template)
}

function loadComponents (componentsToLoad) {
  let componentRequires = componentsToLoad.map((componentDef) => {
    let originalComponentModule
    let componentTemplate
    let compiledTemplate
    let helpersInTemplate
    let componentModule

    if (getComponent(componentDef.name) != null) {
      // component type is already registered don't try to load it again
      return undefined
    }

    originalComponentModule = componentDef.module

    // just for now if the component has no source set a default component,
    // this should probably just throw an error later
    if (!originalComponentModule) {
      originalComponentModule = {
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

    componentTemplate = originalComponentModule.template()

    compiledTemplate = compileTemplate(componentTemplate)

    if (typeof originalComponentModule.helpers === 'function') {
      helpersInTemplate = originalComponentModule.helpers()
    } else {
      helpersInTemplate = {}
    }

    componentModule = Object.assign({}, originalComponentModule, {
      helpers: () => {
        if (typeof originalComponentModule.helpers === 'function') {
          return originalComponentModule.helpers()
        }

        return {}
      },
      render: ({ props, bindings, customCompiledTemplate, data }) => {
        let newProps = Object.assign({}, props)
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

        componentHelpers = Object.assign({
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

    componentsDefinition[componentDef.name] = componentsDefinition[componentDef.name] || componentDef
    components[componentDef.name] = componentModule

    return componentDef.name
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

module.exports.loadComponents = loadComponents
module.exports.getComponentsDefinition = getComponentsDefinition
module.exports.getComponentDefinition = getComponentDefinition
module.exports.getComponents = getComponents
module.exports.getComponent = getComponent
module.exports.compileTemplate = compileTemplate
