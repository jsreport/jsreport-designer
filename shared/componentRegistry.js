
const get = require('lodash/get')
const inlineTemplate = require('lodash/template')
const htmlParser = require('posthtml-parser')
const htmlRender = require('posthtml-render')
const Handlebars = require('handlebars')
const evaluateScript = require('./evaluateScript')
const expressionUtils = require('./expressionUtils')

const componentsDefinition = {}
const components = {}

const interpolateExpressionInHtmlRegExp = (
  /\[([\S]+?)\]/g
)

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
            let resolvedValue

            if (isLazyBinding) {
              return
            }

            currentBinding = bindings[propName]

            if (!isObject(currentBinding)) {
              return
            }

            resolvedValue = resolveBinding({
              binding: currentBinding,
              bindingName: propName,
              expressions: expressions,
              context: data,
              rootContext: data,
              computedFields
            })

            newProps[propName] = resolvedValue
          })
        }

        result.props = newProps

        componentHelpers = Object.assign({
          resolveBinding: (bindingName, context, options) => {
            let currentContext

            if (context == null || options == null) {
              return null
            }

            if (context === '/') {
              currentContext = data
            } else {
              currentContext = context
            }

            return resolveBinding({
              binding: (
                isObject(bindings) &&
                bindings[bindingName] != null
              ) ? bindings[bindingName] : undefined,
              bindingName,
              expressions: expressions,
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

function resolveBinding ({
  binding,
  bindingName,
  expressions,
  context,
  rootContext,
  computedFields
}) {
  if (binding == null || bindingName == null || context == null || rootContext == null) {
    return undefined
  }

  let expressionsMap = expressions != null ? expressions[bindingName] : undefined
  let resolvedContent
  let expressionInput = {
    context,
    rootContext,
    computedFields
  }

  if (isObject(binding.compose)) {
    // resolving rich content
    if (binding.expression != null) {
      const resolvedExpression = resolveBindingExpression(
        expressionsMap,
        binding.expression,
        expressionInput,
        { ensureMap: true }
      )

      resolvedContent = replaceExpressionsInHTML(
        binding.compose.content,
        resolvedExpression.value
      )

      resolvedContent = new Handlebars.SafeString(resolvedContent)
    } else {
      resolvedContent = new Handlebars.SafeString(binding.compose.content)
    }
  } else if (binding.expression != null) {
    // resolving direct value
    const resolvedExpression = resolveBindingExpression(
      expressionsMap,
      binding.expression,
      expressionInput
    )

    if (resolvedExpression.isMap) {
      // if multiple values are returned just resolve to undefined
      // because there is no way to know which value should be used
      resolvedContent = undefined
    } else {
      resolvedContent = resolvedExpression.value
    }
  }

  return resolvedContent
}

function resolveBindingExpression (
  expressionsMap,
  expressionResolution,
  { context, rootContext, computedFields },
  { ensureMap = false } = {}
) {
  let expressions = expressionUtils.getExpression(expressionsMap, expressionResolution)
  let isMap

  if (expressions == null) {
    return {
      value: undefined,
      map: false
    }
  }

  if (Array.isArray(expressions)) {
    isMap = true
  } else {
    isMap = false
    expressions = [expressions]
  }

  const FIELD_TYPE = {
    property: 'p',
    index: 'i',
    computedField: 'c'
  }

  let i

  if (context == null) {
    return {
      value: undefined,
      map: isMap
    }
  }

  let resolved = expressions.reduce((acu, expression) => {
    let currentContext = context

    if (expression.info == null) {
      return acu
    }

    if (expression.info.type === 'function') {
      let result

      try {
        const expressionFn = evaluateScript.getSingleExport(expression.info.value)

        if (typeof expressionFn !== 'function') {
          throw new Error('expression should export a function')
        }

        result = expressionFn(context, rootContext)
      } catch (e) {
        result = undefined
      }

      acu.push({
        name: expression.name,
        result
      })
    } else if (expression.info.type === 'data') {
      let dataExpressionValue = expression.info.value
      let result

      for (i = 0; i < dataExpressionValue.length; i++) {
        const currentExpression = dataExpressionValue[i]
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

      acu.push({ name: expression.name, result })
    }

    return acu
  }, [])

  if (isMap) {
    const value = resolved.reduce((acu, resolvedItem) => {
      acu[resolvedItem.name] = resolvedItem.result

      return acu
    }, {})

    return {
      value,
      map: isMap
    }
  }

  return {
    value: ensureMap === true ? {
      [resolved[0].name]: resolved[0].result
    } : resolved[0].result,
    map: ensureMap === true ? true : isMap
  }
}

function replaceExpressionsInHTML (html, expressionsValues) {
  const parsedHTML = htmlParser(html)
  const expressionsHolders = findExpressionInHTMLNode(parsedHTML)

  if (expressionsHolders == null) {
    // return without modification
    return htmlRender(parsedHTML)
  }

  expressionsHolders.forEach((exprHolder) => {
    let exprHolderContent = htmlRender(exprHolder.node.content)

    // replacing dynamic values in compose content
    exprHolderContent = inlineTemplate(exprHolderContent, {
      // interpolate but with html escape for the dynamic values
      escape: interpolateExpressionInHtmlRegExp
    })(expressionsValues)

    // eliminating code tag and replacing it with just the resolved value
    exprHolder.parent[exprHolder.nodeIndex] = htmlParser(exprHolderContent)[0]
  })

  return htmlRender(parsedHTML)
}

function findExpressionInHTMLNode (node, nodeIndexInParent, parent) {
  let expressionsHolders = []

  if (
    isObject(node) &&
    node.tag === 'code' &&
    node.attrs != null && node.attrs['data-jsreport-designer-expression-name'] != null
  ) {
    expressionsHolders.push({ node, nodeIndex: nodeIndexInParent, parent })
  } else if (Array.isArray(node)) {
    node.forEach((innerNode, innerNodeIdx) => {
      const innerResult = findExpressionInHTMLNode(innerNode, innerNodeIdx, node)

      if (innerResult != null) {
        expressionsHolders = expressionsHolders.concat(innerResult)
      }
    })
  } else if (!isObject(node)) {
    return undefined
  } else if (isObject(node) && node.content != null) {
    const result = findExpressionInHTMLNode(node.content)

    if (result != null) {
      expressionsHolders = expressionsHolders.concat(result)
    }
  }

  if (expressionsHolders.length === 0) {
    return undefined
  }

  return expressionsHolders
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
