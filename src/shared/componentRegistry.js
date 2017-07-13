var Promise = require('bluebird')
var assign = require('lodash/assign')
var Handlebars = require('handlebars')
// requiring inline just for now because we don't have any webpack setup yet
global.designComponents = {}
global.designComponents.Text = require('../shared/designComponents/Text')
global.designComponents.Image = require('../shared/designComponents/Image')

var componentsDefinition = {}
var components = {}

function getComponentsDefinition () {
  return Object.keys(componentsDefinition).map(function (componentType) {
    return componentsDefinition[componentType]
  })
}

function loadComponents (_componentsToLoad) {
  var componentsToLoad = Array.isArray(_componentsToLoad) ? _componentsToLoad : getComponentsDefinition()

  var componentRequires = componentsToLoad.map(function (component) {
    // little dumb condition for now
    var isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    var exportValue = isBrowser ? global.designComponents[component.name] : (component.location ? require(component.location) : undefined)
    var componentTemplate

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

    exportValue = assign({}, exportValue, {
      render: Handlebars.compile(componentTemplate, {
        explicitPartialContext: true
      })
    })

    Handlebars.registerPartial(component.name, componentTemplate)

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
module.exports.getComponentFromType = getComponentFromType
