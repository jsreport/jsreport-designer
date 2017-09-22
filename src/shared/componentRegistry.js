var Promise = require('bluebird')
var assign = require('lodash/assign')
var get = require('lodash/get')
var Handlebars = require('handlebars')
// requiring inline just for now because we don't have any webpack setup yet
global.designComponents = {}
global.designComponents.Text = require('../shared/designComponents/Text')
global.designComponents.Image = require('../shared/designComponents/Image')

var componentsDefinition = {}
var components = {}

function isObject (value) {
  return typeof value === 'object' && !Array.isArray(value)
}

function compileTemplate (template) {
  return Handlebars.compile(template, {
    explicitPartialContext: true
  })
}

function getComponentsDefinition () {
  return Object.keys(componentsDefinition).map(function (componentType) {
    return componentsDefinition[componentType]
  })
}

function getComponentDefinitionFromType (type) {
  return componentsDefinition[type]
}

function loadComponents (_componentsToLoad) {
  var componentsToLoad = Array.isArray(_componentsToLoad) ? _componentsToLoad : getComponentsDefinition()

  var componentRequires = componentsToLoad.map(function (component) {
    // little dumb condition for now
    var isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    var exportValue = isBrowser ? global.designComponents[component.name] : (component.location ? require(component.location) : undefined)
    var componentTemplate
    var compiledTemplate

    // just for now if the component has no source set a default component,
    // this should probably just throw an error later
    if (!exportValue) {
      exportValue = {
        getDefaultProps: function () {
          return {}
        },
        template: function () {
          return '<div>Default empty component</div>'
        }
      }
    }

    componentTemplate = exportValue.template()

    compiledTemplate = compileTemplate(componentTemplate)

    exportValue = assign({}, exportValue, {
      render: function ({ props, bindings, customCompiledTemplate, data }) {
        let newProps = assign({}, props)
        let result = {}

        // checking for binded props
        if (isObject(bindings)) {
          Object.keys(bindings).forEach(function (propName) {
            let currentBinding = bindings[propName]

            if (!isObject(currentBinding)) {
              return
            }

            if (isObject(currentBinding.richContent)) {
              // resolving rich content
              newProps[propName] = new Handlebars.SafeString(currentBinding.richContent.html)
            } else if (typeof currentBinding.defaultExpression === 'string' && currentBinding.defaultExpression !== '') {
              // resolving direct data binding
              newProps[propName] = get(data, currentBinding.defaultExpression, undefined)
            }
          })
        }

        result.props = newProps

        if (customCompiledTemplate) {
          result.content = customCompiledTemplate(newProps)
        } else {
          result.content = compiledTemplate(newProps)
        }

        return result
      }
    })

    componentsDefinition[component.name] = componentsDefinition[component.name] || component
    components[component.name] = exportValue

    return component.name
  })

  return Promise.all(componentRequires)
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
