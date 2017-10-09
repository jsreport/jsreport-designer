
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const assign = require('lodash/assign')
const Promise = require('bluebird')
const componentRegistry = require('../src/shared/componentRegistry')
const readFileAsync = Promise.promisify(fs.readFile)

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
  this.mainStyles = []

  reporter.options.tasks.modules.push({
    alias: 'handlebars',
    path: require.resolve('handlebars')
  })

  reporter.options.tasks.modules.push({
    alias: 'componentRegistry.js',
    path: path.join(__dirname, '../src/shared/componentRegistry')
  })

  this.registerDefaultComponents()

  reporter.initializeListeners.add(definition.name, function () {
    var designTemplatePath = path.join(__dirname, '../static/designTemplate.hbs')

    return Promise.all([
      readFileAsync(designTemplatePath, 'utf8'),
      readFileAsync(path.join(__dirname, '../static/designHelpers.js'), 'utf8'),
      readFileAsync(path.join(__dirname, '../src/Design/DesignContainer/DesignContainer.css'), 'utf8'),
      readFileAsync(path.join(__dirname, '../src/Design/DesignContainer/DesignGroup.css'), 'utf8'),
      readFileAsync(path.join(__dirname, '../src/Design/DesignContainer/DesignItem.css'), 'utf8')
    ]).then(function (results) {
      self.mainTemplate = results[0]
      self.mainHelpers = results[1]
      self.mainStyles = self.mainStyles.concat(results.slice(2))
    })
  })

  reporter.beforeRenderListeners.insert({ before: 'templates' }, definition.name, this.renderDesign.bind(this))
}

Designer.prototype.registerDefaultComponents = function () {
  var reporter = this.reporter

  // description, propsMeta
  this.registerComponent('Text', {
    icon: 'font',
    propsMeta: {
      text: {
        allowsRichContent: true,
        allowedBindingValueTypes: ['scalar']
      }
    },
    location: './designComponents/Text'
  })

  this.registerComponent('Image', {
    icon: 'image',
    propsMeta: {
      url: {
        allowedBindingValueTypes: ['scalar']
      },
      width: {
        allowedBindingValueTypes: ['scalar']
      },
      height: {
        allowedBindingValueTypes: ['scalar']
      }
    },
    location: './designComponents/Image'
  })

  this.registerComponent('Table', {
    icon: 'table',
    propsMeta: {
      data: {
        allowedBindingValueTypes: ['scalar']
      },
      columns: {
        allowsBinding: false,
        properties: {}
      }
    },
    location: './designComponents/Table'
  })

  this.registerComponent('Products-Map', {
    icon: 'map',
    collection: 'Group1'
  })

  this.registerComponent('Pie-Chart', {
    icon: 'pie-chart',
    collection: 'Group2'
  })

  this.registerComponent('QR', {
    icon: 'qrcode',
    collection: 'Group2'
  })

  this.registerComponent('User-Info', {
    icon: 'address-card',
    collection: 'Group2'
  })
}

Designer.prototype.registerComponent = function (name, definition) {
  var reporter = this.reporter

  reporter.logger.debug('Registering component ' + name + ' for designer')

  componentRegistry.registerComponent(name, definition)
}

Designer.prototype.renderDesign = function (req, res) {
  let designPayload
  let designOutput
  let designInputs

  if (!req.template || !req.template.design) {
    return
  }

  req.logger.debug('Designer data specified, getting template content from components..')

  designPayload = req.template.design

  if (designPayload.grid == null) {
    throw new Error('design payload needs "grid" property, check the "design" object in "template" property of request body')
  }

  if (typeof designPayload.grid !== 'object' || (typeof designPayload.grid === 'object' && Array.isArray(designPayload.grid))) {
    throw new Error('design payload needs "grid" property to be an object, check the "design" object in "template" property of request body')
  }

  if (
    isNaN(designPayload.grid.width) ||
    (typeof designPayload.grid.width !== 'string' && typeof designPayload.grid.width !== 'number')
  ) {
    throw new Error('design payload needs "grid.width" property to be a valid number, check the "design" object in "template" property of request body')
  }

  designPayload.grid.width = parseFloat(designPayload.grid.width)

  if (
    isNaN(designPayload.grid.numberOfCols) ||
    (typeof designPayload.grid.numberOfCols !== 'string' && typeof designPayload.grid.numberOfCols !== 'number')
  ) {
    throw new Error('design payload needs "grid.numberOfCols" property to be a valid number, check the "design" object in "template" property of request body')
  }

  designPayload.grid.numberOfCols = parseInt(designPayload.grid.numberOfCols, 10)

  if (
    isNaN(designPayload.grid.defaultRowHeight) ||
    (typeof designPayload.grid.defaultRowHeight !== 'string' && typeof designPayload.grid.defaultRowHeight !== 'number')
  ) {
    throw new Error('design payload needs "grid.defaultRowHeight" property to be a valid number, check the "design" object in "template" property of request body')
  }

  designPayload.grid.defaultRowHeight = parseInt(designPayload.grid.defaultRowHeight, 10)

  if (designPayload.groups == null) {
    throw new Error('design payload needs "groups" property, check the "design" object in "template" property of request body')
  }

  if (designPayload.groups === '') {
    designPayload.groups = []
  }

  if (!Array.isArray(designPayload.groups)) {
    throw new Error('design payload needs "groups" property to be a valid array, check the "design" object in "template" property of request body')
  }

  // TODO: only send the component types used in the design if there is
  // some hint in the json payload
  designInputs = {
    componentsDefinition: componentRegistry.getComponentsDefinition(),
    styles: this.mainStyles,
    grid: designPayload.grid,
    groups: designPayload.groups
  }

  if (req.template.helpers && typeof req.template.helpers === 'object') {
    // this is the case when the jsreport is used with in-process strategy
    // and additinal helpers are passed as object
    // in this case we need to merge in xlsx helpers
    req.template.helpers.require = require
    req.template.helpers.componentRegistry = require(path.join(__dirname, '../src/shared/componentRegistry'))

    req.template.helpers.getDesignInputs = () => {
      return designInputs
    }

    return vm.runInNewContext(this.mainHelpers, req.template.helpers)
  }

  req.template = assign(req.template, {
    content: this.mainTemplate,
    helpers: `let INPUTS = ${JSON.stringify(designInputs)}; \n ${this.mainHelpers}`,
    engine: 'handlebars'
  })
}
