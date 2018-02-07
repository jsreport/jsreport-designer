
const get = require('lodash/get')
const inlineTemplate = require('lodash/template')
const htmlParser = require('posthtml-parser')
const htmlRender = require('posthtml-render')
const Handlebars = require('handlebars')
const evaluateScript = require('./evaluateScript')
const expressionUtils = require('./expressionUtils')
const generalStyles = require('./generalStyles')
const isStyleProp = require('./isStyleProp')

const isBrowserContext = (
  typeof window === 'object' &&
  typeof window.Node === 'function'
)

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
  if (typeof template === 'function') {
    return template
  }

  return Handlebars.compile(template)
}

function loadComponents (componentsToLoad, reload = false) {
  const componentRequires = componentsToLoad.map((componentDef) => {
    const styleProps = []
    let originalComponentModule
    let compiledTemplate
    let componentModule

    if (!reload && getComponent(componentDef.name) != null) {
      // component type is already registered don't try to load it again
      return undefined
    }

    // identifying style props
    if (componentDef.propsMeta) {
      Object.keys(componentDef.propsMeta).forEach((propName) => {
        if (isStyleProp(componentDef.propsMeta[propName])) {
          styleProps.push(propName)
        }
      })
    }

    originalComponentModule = componentDef.module

    // just for now if the component has no source set a default component,
    // this should probably just throw an error later
    if (!originalComponentModule) {
      originalComponentModule = {
        getDefaultProps: () => {
          return {}
        },
        getStyleProps: () => styleProps,
        template: () => {
          return '<div>Default empty component</div>'
        },
        helpers: () => {
          return {}
        }
      }
    }

    compiledTemplate = compileTemplate(
      callInterop(originalComponentModule, originalComponentModule.template)
    )

    componentModule = Object.assign({}, originalComponentModule, {
      getDefaultProps: () => {
        return callInterop(originalComponentModule, originalComponentModule.getDefaultProps)
      },
      getStyleProps: () => styleProps,
      template: () => {
        return callInterop(originalComponentModule, originalComponentModule.template)
      },
      helpers: () => {
        if (!originalComponentModule.helpers) {
          return {}
        }

        return callInterop(originalComponentModule, originalComponentModule.helpers)
      },
      render: ({
        customCompiledTemplate,
        ...restPayload
      }) => {
        const templateToUse = customCompiledTemplate != null ? customCompiledTemplate : compiledTemplate

        return renderComponentTemplate({
          componentType: componentDef.name,
          template: templateToUse,
          helpers: componentModule.helpers()
        }, restPayload)
      }
    })

    componentsDefinition[componentDef.name] = componentsDefinition[componentDef.name] || componentDef
    components[componentDef.name] = componentModule

    return componentDef.name
  })

  return componentRequires
}

function renderComponentTemplate ({
  componentType,
  template,
  helpers
}, {
  props,
  bindings,
  expressions,
  data,
  computedFields,
  fragmentPlaceholders
}) {
  const newProps = Object.assign({}, props)
  let result = {}
  let fragments = {}
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

  // TODO: use styleProps var here to filter allowed or
  // disallowed style props when we support such configuration (if it makes sense)

  result.props = newProps

  componentHelpers = Object.assign({
    $resolveBinding: (bindingName, context, options) => {
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
    },
    $resolveStyle: (stylePropName) => {
      return resolveStyle({
        stylePropName,
        props: newProps,
        bindings,
        expressions,
        context: data,
        computedFields
      })
    },
    $renderFragment: (options) => {
      return renderFragment(
        fragmentPlaceholders,
        options
      )
    }
  }, helpers != null ? helpers : {})

  result.content = template(newProps, {
    data: {
      componentOwnerType: componentType,
      componentType,
      fragments
    },
    helpers: componentHelpers
  })

  if (Object.keys(fragments).length > 0) {
    result.fragments = fragments
  }

  return result
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
    if (binding.compose.conditional === true || isObject(binding.compose.conditional)) {
      // resolving conditional compose
      const resolvedExpression = resolveBindingExpression(
        expressionsMap,
        binding.expression,
        expressionInput,
        {
          conditional: true
        }
      )

      if (resolvedExpression.map) {
        if (isObject(binding.compose.content)) {
          resolvedContent = binding.compose.content[Object.keys(resolvedExpression.value)[0]]
        } else {
          resolvedContent = undefined
        }
      } else {
        // no expression defined returned true so we take
        // the default value if it was defined
        resolvedContent = (
          isObject(binding.compose.conditional) &&
          binding.compose.conditional.default != null
        ) ? binding.compose.conditional.default : undefined
      }
    } else if (binding.expression != null) {
      // resolving rich content
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
  { ensureMap = false, conditional = false } = {}
) {
  let expressions = expressionUtils.getExpression(expressionsMap, expressionResolution)
  let isMap
  let resolved

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

  if (conditional === true) {
    expressions.some((expression) => {
      let returnedTrue = false

      if (expression.info.type === 'function') {
        let result

        try {
          const expressionFn = evaluateScript.getSingleExport(expression.info.value)

          if (typeof expressionFn !== 'function') {
            throw new Error('expression should export a function')
          }

          result = expressionFn(context, rootContext)
          returnedTrue = result === true

          if (returnedTrue === true) {
            resolved = [{
              name: expression.name,
              result: result
            }]
          }
        } catch (e) {
          result = undefined
        }
      }

      return returnedTrue === true
    })
  } else {
    resolved = expressions.reduce((acu, expression) => {
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
  }

  if (conditional && !resolved) {
    return {
      value: undefined,
      isMap: false
    }
  }

  if (isMap || conditional) {
    const value = resolved.reduce((acu, resolvedItem) => {
      acu[resolvedItem.name] = resolvedItem.result

      return acu
    }, {})

    return {
      value,
      map: true
    }
  }

  return {
    value: ensureMap === true ? {
      [resolved[0].name]: resolved[0].result
    } : resolved[0].result,
    map: ensureMap === true ? true : isMap
  }
}

function resolveStyle ({
  stylePropName,
  props,
  bindings,
  expressions,
  context,
  computedFields
}) {
  let styleValues
  let style

  if (bindings != null) {
    const bindingNames = Object.keys(bindings)
    // eslint-disable-next-line no-useless-escape
    const styleKeysReg = new RegExp(`^@${stylePropName}\.([^\s\n\r]+)`)
    let stylesToResolve = []

    styleValues = {}

    bindingNames.forEach((bName) => {
      const result = styleKeysReg.exec(bName)
      let value

      if (result == null) {
        return
      }

      const styleKey = result[1]
      const styleBinding = bindings[bName]

      stylesToResolve.push(styleKey)

      if (
        expressions != null &&
        Array.isArray(styleBinding.expression) &&
        styleBinding.expression.length > 0
      ) {
        value = resolveBinding({
          binding: styleBinding,
          bindingName: bName,
          expressions,
          context: context,
          rootContext: context,
          computedFields
        })
      } else if (
        isObject(styleBinding.compose) &&
        isObject(styleBinding.compose.conditional) &&
        styleBinding.compose.conditional.default != null
      ) {
        // grab the default case is there is no expressions to resolve
        value = styleBinding.compose.conditional.default
      } else {
        return
      }

      styleValues[styleKey] = value
    })

    if (stylesToResolve.length === 0) {
      // resolve from props when there is no
      // style bindings to resolve
      stylesToResolve = generalStyles.styles
      styleValues = props[stylePropName]
    }

    style = generalStyles.resolver(
      stylesToResolve,
      generalStyles.stylesMap,
      styleValues
    )
  } else {
    styleValues = props[stylePropName]

    style = generalStyles.resolver(
      generalStyles.styles,
      generalStyles.stylesMap,
      styleValues
    )
  }

  if (style == null) {
    style = ''
  }

  return style
}

function renderFragment (placeholdersOutput, options) {
  const componentOwnerType = options.data.componentOwnerType
  const componentType = options.data.componentType
  const fragments = options.data.fragments
  const name = options.hash.name
  let result = ''
  let shouldRenderPlaceholder
  let contentData

  if (placeholdersOutput != null) {
    shouldRenderPlaceholder = placeholdersOutput
  } else {
    shouldRenderPlaceholder = isBrowserContext
  }

  if (name == null || typeof name !== 'string' || name.trim() === '') {
    throw new Error('$renderFragment helper should be called with an name')
  }

  if (fragments[name] != null) {
    throw new Error(`$renderFragment with name "${name}" already exists in this context`)
  }

  if (options.data) {
    contentData = Handlebars.createFrame(options.data)
  } else {
    contentData = Handlebars.createFrame({})
  }

  if (typeof options.hash.inlineTag === 'string') {
    const tag = options.hash.inlineTag
    const newComponentType = `${componentType}#${name}`

    // create the fragment space after rendering the content
    // to be able to detect fragments with duplicate name in the
    // same context
    fragments[name] = {}

    // creating container for fragments
    // inside the fragment itself if any
    contentData.fragments = {}

    // pass composed new component type to any child
    contentData.componentType = newComponentType

    const content = options.fn(this, { data: contentData })

    // when rendering in browser means that we are in design mode,
    // so in that case we just insert a comment placeholder for later
    // replace it with the real html
    if (shouldRenderPlaceholder) {
      result = `<!-- jsreport-designer-fragment#name=${name} -->`
    } else {
      result = `<${tag}>${content}</${tag}>`
    }

    fragments[name].name = name
    fragments[name].type = newComponentType
    fragments[name].ownerType = componentOwnerType
    fragments[name].mode = 'inline'
    fragments[name].tag = tag
    fragments[name].sketch = content
    fragments[name].template = options.fn

    if (Object.keys(contentData.fragments).length > 0) {
      fragments[name].fragments = { ...contentData.fragments }
    }
  }

  return new Handlebars.SafeString(result)
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
  renderComponentTemplate,
  componentsCache: {}
}
