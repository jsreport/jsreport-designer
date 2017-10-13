
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const Promise = require('bluebird')
const componentRegistry = require('@local/shared/componentRegistry')
const readFileAsync = Promise.promisify(fs.readFile)

class Designer {
  constructor (reporter, definition) {
    this.reporter = reporter
    this.definition = definition
    this.componentTypes = {}
    this.componentTypesModuleIds = {}
    this.mainStyles = []

    reporter.options.tasks.modules.push({
      alias: 'handlebars',
      path: require.resolve('handlebars')
    })

    reporter.options.tasks.modules.push({
      alias: 'componentRegistry.js',
      path: path.join(__dirname, '../shared/componentRegistry')
    })

    reporter.initializeListeners.add(definition.name, () => {
      let designTemplatePath = path.join(__dirname, './static/designTemplate.hbs')

      // allowing importing components in jsreport helpers
      Object.keys(this.componentTypes).forEach((compName) => {
        let compModuleId = this.componentTypesModuleIds[compName]
        let fullPath

        if (compModuleId == null) {
          return
        }

        fullPath = require.resolve(compModuleId.id)

        this.componentTypesModuleIds[compName].full = fullPath

        reporter.options.tasks.modules.push({
          alias: fullPath,
          path: fullPath
        })
      })

      return Promise.all([
        readFileAsync(designTemplatePath, 'utf8'),
        readFileAsync(path.join(__dirname, './static/designHelpers.js'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/components/Design/DesignContainer/DesignContainer.css'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/components/Design/DesignContainer/DesignGroup.css'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/components/Design/DesignContainer/DesignItem.css'), 'utf8')
      ]).then((results) => {
        this.mainTemplate = results[0]
        this.mainHelpers = results[1]
        this.mainStyles = this.mainStyles.concat(results.slice(2))
      })
    })

    reporter.beforeRenderListeners.insert({ before: 'templates' }, definition.name, this.renderDesign.bind(this))

    reporter.on('express-configure', (app) => {
      app.get('/api/componentTypes', (req, res) => {
        res.json(reporter.designer.componentTypes)
      })
    })
  }

  registerComponent (componentDefinition, componentModuleId) {
    let reporter = this.reporter

    reporter.logger.debug(`Registering component ${componentDefinition.name} for designer`)

    this.componentTypes[componentDefinition.name] = componentDefinition

    if (componentModuleId != null) {
      this.componentTypesModuleIds[componentDefinition.name] = {
        id: componentModuleId
      }
    }
  }

  renderDesign (req, res) {
    let designPayload
    let designOutput
    let designInputs

    if (!req.template || !req.template.design) {
      return
    }

    req.logger.debug('Designer data specified, getting template content from components..')

    designPayload = req.template.design

    console.log('DATA INPUT:', req.data)
    console.log('DESIGN PAYLOAD:', designPayload)

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
      componentTypesDefinition: this.componentTypes,
      componentTypesModuleIds: this.componentTypesModuleIds,
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

    req.template = Object.assign(req.template, {
      content: this.mainTemplate,
      helpers: `let INPUTS = ${JSON.stringify(designInputs)}; \n ${this.mainHelpers}`,
      engine: 'handlebars'
    })
  }
}

function registerDefaultComponents (reporter) {
  // description, propsMeta
  reporter.designer.registerComponent({
    name: 'Text',
    propsMeta: {
      text: {
        allowsRichContent: true,
        allowedBindingValueTypes: ['scalar']
      }
    }
  }, '@local/shared/components/Text')

  reporter.designer.registerComponent({
    name: 'Image',
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
    }
  }, '@local/shared/components/Image')

  reporter.designer.registerComponent({
    name: 'Table',
    propsMeta: {
      data: {
        allowedBindingValueTypes: ['scalar']
      },
      columns: {
        allowsBinding: false,
        properties: {}
      }
    }
  }, '@local/shared/components/Table')

  reporter.designer.registerComponent({
    name: 'Products-Map',
    group: 'Group1'
  })

  reporter.designer.registerComponent({
    name: 'Pie-Chart',
    group: 'Group2'
  })

  reporter.designer.registerComponent({
    name: 'QR',
    group: 'Group2'
  })

  reporter.designer.registerComponent({
    name: 'User-Info',
    group: 'Group2'
  })
}

module.exports = function (reporter, definition) {
  reporter.designer = new Designer(reporter, definition)

  registerDefaultComponents(reporter)
}
