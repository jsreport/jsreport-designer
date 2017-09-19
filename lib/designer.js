
var path = require('path')
var fs = require('fs')
var assign = require('lodash/assign')
var Promise = require('bluebird')
var Handlebars = require('handlebars')
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
  this.globalStyles = []

  reporter.initializeListeners.add(definition.name, function () {
    var designTemplatePath = path.join(__dirname, '../static/designTemplate.hbs')

    return componentRegistry.loadComponents().then(function () {
      return Promise.all([
        readFileAsync(designTemplatePath, 'utf8'),
        readFileAsync(path.join(__dirname, '../src/Design/DesignContainer/DesignContainer.css'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/Design/DesignContainer/DesignGroup.css'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/Design/DesignContainer/DesignItem.css'), 'utf8')
      ]).then(function (results) {
        var designTemplateContent = results[0]

        self.designTemplate = Handlebars.compile(designTemplateContent, {
          explicitPartialContext: true
        })

        self.globalStyles = self.globalStyles.concat(results.slice(1))
      })
    })
  })

  reporter.beforeRenderListeners.insert({ before: 'templates' }, definition.name, this.parsePayload.bind(this))

  this.registerDefaultComponents()
}

Designer.prototype.registerDefaultComponents = function () {
  var reporter = this.reporter

  // description, propsMeta
  this.registerComponent('Text', {
    icon: 'font',
    helpers: '',
    propsMeta: {
      text: {
        allowsRichContent: true
      }
    },
    location: './designComponents/Text'
  })

  this.registerComponent('Image', {
    icon: 'image',
    helpers: '',
    location: './designComponents/Image',
  })

  this.registerComponent('Products-Map', {
    icon: 'map',
    helpers: '',
    collection: 'Group1'
  })

  this.registerComponent('Pie-Chart', {
    icon: 'pie-chart',
    helpers: '',
    collection: 'Group2'
  })

  this.registerComponent('QR', {
    icon: 'qrcode',
    helpers: '',
    collection: 'Group2'
  })

  this.registerComponent('User-Info', {
    icon: 'address-card',
    helpers: '',
    collection: 'Group2'
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

  designOutput = this.renderDesign(req.data, designPayload.grid, designPayload.groups)

  return req.template = assign(req.template, {
    content: designOutput.content,
    helpers: designOutput.helpers,
    // change this to the engine type of design if any
    engine: 'none'
  })
}

Designer.prototype.renderDesign = function (dataInput, grid, groups) {
  var self = this
  var designTemplate = this.designTemplate
  var designStyles = this.globalStyles.slice(0)
  var designHelpers = []

  designHelpers = designHelpers.length > 0 ? designHelpers.join('') : undefined

  return {
    content: designTemplate({
      styles: designStyles,
      baseWidth: grid.width,
      defaultRowHeight: grid.defaultRowHeight,
      groups: groups
    }, {
      data: {
        __gridNumberOfCols__: grid.numberOfCols,
        __dataInput__: dataInput
      },
      helpers: {
        __getDefaultPropsForComponent__: getDefaultPropsForComponent,
        __renderDesignGroup__: renderDesignGroup,
        __renderDesignItem__: renderDesignItem,
        renderComponent: renderComponent
      }
    }),
    helpers: designHelpers
  }
}

function getDefaultPropsForComponent (type, props) {
  var componentType = componentRegistry.getComponentFromType(type)

  return assign({}, componentType.getDefaultProps(), props)
}

function renderDesignGroup (designGroup, defaultRowHeight, options) {
  var designGroupContent = '<div class="DesignGroup" '
  var itemsLength = designGroup.items.length
  var idx
  var childData

  if (designGroup.topSpace != null) {
    designGroupContent += 'style="margin-top: ' + Handlebars.escapeExpression(designGroup.topSpace * defaultRowHeight) + 'px" '
  }

  designGroupContent += 'data-layout-' + Handlebars.escapeExpression(designGroup.layoutMode) + '-mode="true" '

  designGroupContent += '>'

  if (options.data) {
    childData = Handlebars.createFrame(options.data);
  }

  if (childData) {
    childData['__designGroupLayoutMode__'] = designGroup.layoutMode
  }

  if (Array.isArray(designGroup.items)) {
    for(idx = 0; idx < itemsLength; idx++) {
      designGroupContent += options.fn(designGroup.items[idx], { data: childData })
    }
  }

  designGroupContent += '</div>'

  return new Handlebars.SafeString(designGroupContent)
}

function renderDesignItem (designItem, options) {
  var designItemContent = '<div class="DesignItem" '
  var gridNumberOfCols = options.data.__gridNumberOfCols__
  var layoutMode = options.data.__designGroupLayoutMode__
  var itemStyles = 'style="'

  if (layoutMode === 'grid') {
    itemStyles += (
      'width: ' +
      Handlebars.escapeExpression(
        getWidthInPercentage({
          numberOfCols: gridNumberOfCols,
          consumedCols: designItem.space
        })
      ) +
      '%; '
    )

    if (designItem.leftSpace != null) {
      itemStyles += (
        'margin-left: ' +
        Handlebars.escapeExpression(
          getWidthInPercentage({
            numberOfCols: gridNumberOfCols,
            consumedCols: designItem.leftSpace
          })
        ) +
        '%; '
      )
    }
  } else {
    itemStyles += (
      'width: ' +
      Handlebars.escapeExpression(designItem.space) +
      'px; '
    )

    if (designItem.leftSpace != null) {
      itemStyles += (
        'margin-left: ' +
        Handlebars.escapeExpression(designItem.leftSpace) +
        'px; '
      )
    }
  }

  itemStyles +='" '

  designItemContent += itemStyles + ' '
  designItemContent += 'data-layout-' + Handlebars.escapeExpression(layoutMode) + '-mode="true" '

  designItemContent += '>'

  designItemContent += options.fn(designItem)

  designItemContent += '</div>'

  return new Handlebars.SafeString(designItemContent)
}

function renderComponent (type, props, _customTemplate, _options) {
  var argsCount = arguments.length
  var options
  var customTemplate
  var customCompiledTemplate
  var render

  if (argsCount.length <= 3) {
    options = customTemplate
    customTemplate = undefined
  } else {
    options = _options
    customTemplate = _customTemplate
  }

  render = componentRegistry.getComponentFromType(type).render

  if (customTemplate != null) {
    customCompiledTemplate = componentRegistry.compileTemplate(customTemplate)
  }

  return new Handlebars.SafeString(render(props, options.data.__dataInput__, customCompiledTemplate))
}

function getWidthInPercentage (options) {
  return 100 / (options.numberOfCols / options.consumedCols)
}
