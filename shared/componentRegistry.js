
const get = require('lodash/get')
const Handlebars = require('handlebars')
const expressionUtils = require('./expressionUtils')

const componentsDefinition = {}
const components = {}

function isObject (value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
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

function loadComponents (componentsToLoad, reload = false) {
  const componentRequires = componentsToLoad.map((componentDef) => {
    let originalComponentModule
    let componentTemplate
    let compiledTemplate
    let componentModule

    if (!reload && getComponent(componentDef.name) != null) {
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

    componentTemplate = callInterop(originalComponentModule, originalComponentModule.template)
    compiledTemplate = compileTemplate(componentTemplate)

    componentModule = Object.assign({}, originalComponentModule, {
      getDefaultProps: () => {
        return callInterop(originalComponentModule, originalComponentModule.getDefaultProps)
      },
      template: () => {
        return callInterop(originalComponentModule, originalComponentModule.template)
      },
      helpers: () => {
        if (originalComponentModule.helpers) {
          return callInterop(originalComponentModule, originalComponentModule.helpers)
        }

        return {}
      },
      render: ({ props, bindings, expressions, customCompiledTemplate, data, computedFields }) => {
        const newProps = Object.assign({}, props)
        let result = {}
        let componentHelpers

        // checking for binded props
        if (isObject(bindings)) {
          Object.keys(bindings).forEach((propName) => {
            const isLazyBinding = propName[0] === '@'
            let currentBinding
            let expressionsMap

            if (isLazyBinding) {
              return
            }

            currentBinding = bindings[propName]
            expressionsMap = expressions != null ? expressions[propName] : undefined

            if (!isObject(currentBinding)) {
              return
            }

            if (isObject(currentBinding.richContent)) {
              // resolving rich content
              newProps[propName] = new Handlebars.SafeString(currentBinding.richContent.html)
            } else if (currentBinding.expression != null) {
              // resolving direct data binding
              newProps[propName] = resolveBindingExpression(expressionsMap, currentBinding.expression, {
                context: data,
                rootContext: data,
                computedFields
              })
            }
          })
        }

        result.props = newProps

        componentHelpers = Object.assign({
          resolveBinding: (bindingName, context, options) => {
            let expressionsMap
            let expressionResolution
            let currentContext

            if (context == null || options == null) {
              return null
            }

            if (context === '/') {
              currentContext = data
            } else {
              currentContext = context
            }

            expressionsMap = expressions != null ? expressions[bindingName] : undefined

            if (isObject(bindings) && bindings[bindingName] != null) {
              expressionResolution = bindings[bindingName].expression
            }

            if (!expressionResolution) {
              return undefined
            }

            return resolveBindingExpression(expressionsMap, expressionResolution, {
              context: currentContext,
              rootContext: data,
              computedFields
            })
          }
        }, componentModule.helpers())

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

function resolveBindingExpression (expressionsMap, expressionResolution, { context, rootContext, computedFields }) {
  let expression = expressionUtils.getExpression(expressionsMap, expressionResolution)

  const FIELD_TYPE = {
    property: 'p',
    index: 'i',
    computedField: 'c'
  }

  let i

  let currentContext = context
  let result

  if (context == null || expression == null) {
    return undefined
  }

  expression = expression.value

  for (i = 0; i < expression.length; i++) {
    const currentExpression = expression[i]
    let keySeparatorAt
    let fieldType
    let key

    if (currentExpression === '') {
      result = context
      break
    }

    keySeparatorAt = currentExpression.indexOf(':')

    if (keySeparatorAt === -1) {
      result = undefined
      break
    }

    fieldType = currentExpression.slice(0, keySeparatorAt)
    key = currentExpression.slice(keySeparatorAt + 1)

    if (key === '') {
      result = undefined
      break
    }

    if (Array.isArray(currentContext) && fieldType === FIELD_TYPE.property) {
      result = undefined
      break
    }

    if (fieldType === FIELD_TYPE.computedField) {
      if (computedFields && computedFields[key]) {
        result = computedFields[key]
      } else {
        result = undefined
      }
    } else {
      result = get(currentContext, key, undefined)
    }

    if (result === undefined) {
      break
    }

    currentContext = result
  }

  return result
}

function callInterop (context, fn) {
  if (fn && fn.default) {
    return fn.default.apply(context)
  }

  return fn.apply(context)
}

module.exports = {
  loadComponents,
  getComponentsDefinition,
  getComponentDefinition,
  getComponents,
  getComponent,
  compileTemplate,
  componentsCache: {}
}
