
var path = require('path')
var fs = require('fs')
var assign = require('lodash/assign')
var Promise = require('bluebird')
var React = require('react')
var ReactDOMServer = require('react-dom/server')
var componentRegistry = require('../src/shared/componentRegistry')
var readFileAsync = Promise.promisify(fs.readFile)

module.exports = function (reporter, definition) {
  initDesigner(reporter, definition)
}

function initDesigner (reporter, definition) {
  return new Designer(reporter, definition)
}

function Designer (reporter, definition) {
  var self = this

  this.reporter = reporter
  this.definition = definition
  this.components = {}

  reporter.initializeListeners.add(definition.name, function () {
    var baseLayoutPath = path.join(__dirname, '../static/baseLayoutForDesign.html')

    return readFileAsync(baseLayoutPath, 'utf8').then(function (content) {
      self.baseLayout = content
    }).then(function () {
      return componentRegistry.loadComponents()
    })
  })

  reporter.beforeRenderListeners.insert({ before: 'templates' }, definition.name, this.parsePayload.bind(this))

  this.registerDefaultComponents()
}

Designer.prototype.registerDefaultComponents = function () {
  var reporter = this.reporter

  // description, propsSchema
  this.registerComponent('Text', {
    helpers: '',
    location: './designComponents/Text'
  })

  this.registerComponent('Image', {
    helpers: '',
    location: './designComponents/Image',
  })
}

Designer.prototype.registerComponent = function (name, definition) {
  var reporter = this.reporter

  reporter.logger.debug('Registering component ' + name + ' for designer')

  componentRegistry.registerComponent(name, definition)
}

Designer.prototype.parsePayload = function (req, res) {
  var designPayload
  var designOutput

  if (!req.template || !req.template.designer) {
    return
  }

  req.logger.debug('Designer data specified, getting template content from components..')

  designPayload = req.template.designer

  if (!designPayload.grid) {
    throw new Error('design payload needs "grid" property, check the "designer" object in "template" property of request body')
  }

  if (typeof designPayload.grid.width !== 'number') {
    throw new Error('design payload needs "grid.width" property to be a valid number, check the "designer" object in "template" property of request body')
  }

  if (!designPayload.components) {
    throw new Error('design payload needs "components" property, check the "designer" object in "template" property of request body')
  }

  if (!Array.isArray(designPayload.components)) {
    throw new Error('design payload needs "components" property to be a valid array, check the "designer" object in "template" property of request body')
  }

  designOutput = this.createDesign(designPayload.grid, designPayload.components)

  return req.template = assign(req.template, {
    content: designOutput.content,
    helpers: designOutput.helpers,
    // change this to the engine type of design if any
    engine: 'none',
    // change this to the recipe type of design
    recipe: 'phantom-pdf'
  })
}

Designer.prototype.createDesign = function (grid, components) {
  var self = this
  var designContent = this.baseLayout
  var componentsContent = []
  var componentsHelpers = []

  designContent = designContent.replace('$gridWidth', grid.width + 'px')

  components.forEach(function (comp) {
    var ComponentType = componentRegistry.getComponentFromType([comp.componentType])
    var compContent = ''
    var compWrapperStyles = ''

    if (ComponentType == null) {
      throw new Error(
        'not registered component "' + comp + '" found ' +
        'while creating design content, please check that you are using ' +
        'a known and registered component in your design'
      )
    }

    componentsHelpers.push(ComponentType.helpers || '')

    compContent = ReactDOMServer.renderToStaticMarkup(React.createElement(ComponentType, comp.props))

    // TODO: make logic for row grouping
    compWrapperStyles = (
      'position: absolute;' +
      'padding-top: ' + (comp.position.top.row * comp.colHeight) + 'px;' +
      'padding-left: ' + (comp.position.left.col * comp.colWidth) + 'px;' +
      'outline: none;'
    )

    compContent = (
      '<div style="' + compWrapperStyles + '">' +
      compContent +
      '</div>'
    )

    componentsContent.push(compContent)
  })

  designContent = designContent.replace('$components', componentsContent.join(''))
  designHelpers = componentsHelpers.length > 0 ? componentsHelpers.join('') : undefined

  return {
    content: designContent,
    helpers: designHelpers
  }
}
