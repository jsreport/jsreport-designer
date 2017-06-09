var Promise = require('bluebird')
var React = require('react')
var assign = require('lodash/assign')
// requiring inline just for now because we don't have any webpack setup yet
global.designComponents = {}
global.designComponents.Text = require('../shared/designComponents/Text')
global.designComponents.Image = require('../shared/designComponents/Image')

var components = {}

function getComponents () {
  return Object.keys(components).map(function (componentType) {
    return components[componentType]
  })
}

function loadComponents (_componentsToLoad) {
  var componentsToLoad = Array.isArray(_componentsToLoad) ? _componentsToLoad : getComponents()

  var componentRequires = componentsToLoad.map(function (component) {
    // little dumb condition for now
    var isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    var exportValue = isBrowser ? global.designComponents[component.name] : require(component.location)

    components[component.name] = components[component.name] || {}
    components[component.name].component = exportValue

    return component.name
  })

  return Promise.all(componentRequires)
}

function registerComponent (name, definition) {
  components[name] = assign({ name: name }, definition)
}

function getComponentFromType (type) {
  var comp = components[type] || {}

  if (comp.component) {
    return comp.component
  }

  return function () {
    return React.createElement(
      "span",
      null,
      "Default empty component"
    )
  }
}

module.exports.loadComponents = loadComponents
module.exports.registerComponent = registerComponent
module.exports.getComponentFromType = getComponentFromType
