
(function (global, _inputs) {
  const Handlebars = require('handlebars')
  const componentRegistry = this.componentRegistry || require('componentRegistry.js')
  const inputs = _inputs != null ? _inputs : getDesignInputs()

  const designInfo = {
    styles: inputs.styles,
    grid: inputs.grid,
    groups: inputs.groups
  }

  let componentsToLoad = Object.keys(inputs.componentTypesDefinition).map((compName) => {
    let compDef = inputs.componentTypesDefinition[compName]
    let componentModule = inputs.componentTypesModuleIds[compDef.name]

    if (componentModule != null) {
      componentModule = require(componentModule.full)
    } else {
      componentModule = undefined
    }

    return Object.assign({}, compDef, { module: componentModule })
  })

  componentRegistry.loadComponents(componentsToLoad)

  function getDesignInformation (keyPath) {
    let pathParts
    let result

    if (keyPath == null || keyPath === '') {
      return designInfo
    }

    pathParts = keyPath.split('.')
    result = designInfo

    for (let i = 0, len = pathParts.length; i < len; i++) {
      let currentKey = pathParts[i]

      if (typeof result === 'object' || Array.isArray(result)) {
        result = result[currentKey]
      } else {
        result = undefined
        break;
      }

      if (result == null) {
        result === undefined
        break;
      }
    }

    return result
  }

  function renderDesignGroup (designGroup, defaultRowHeight, options) {
    let designGroupContent = '<div class="DesignGroup" '
    let itemsLength = designGroup.items.length
    let idx
    let childData

    if (designGroup.topSpace != null) {
      designGroupContent += 'style="margin-top: ' + Handlebars.escapeExpression(designGroup.topSpace * defaultRowHeight) + 'px" '
    }

    designGroupContent += 'data-layout-' + Handlebars.escapeExpression(designGroup.layoutMode) + '-mode="true" '

    designGroupContent += '>'

    if (options.data) {
      childData = Handlebars.createFrame(options.data);
    } else {
      childData = Handlebars.createFrame({})
    }

    if (childData) {
      childData.designGroupLayoutMode = designGroup.layoutMode
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
    let designItemContent = '<div class="DesignItem" '
    let gridNumberOfCols = designInfo.grid.numberOfCols
    let layoutMode = options.data.designGroupLayoutMode
    let itemStyles = 'style="'

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

  function renderComponent (type, _props, _bindings, _customTemplate, _options) {
    let argsCount = arguments.length
    let options
    let props
    let bindings
    let customTemplate
    let customCompiledTemplate
    let component
    let renderingResult

    if (argsCount.length === 1) {
      throw new Error('"renderComponent" should be called at least with the type argument')
    }

    component = componentRegistry.getComponent(type)

    if (!component) {
      throw new Error(`There is no component registered with the type: "${type}", make sure to pass a valid component type to "renderComponent"`)
    }

    if (argsCount.length <= 2) {
      props = getDefaultPropsForComponent(component, undefined)
      options = _props
      bindings = undefined
      customTemplate = undefined
    } else if (argsCount.length <= 3) {
      props = getDefaultPropsForComponent(component, _props)
      options = _bindings
      bindings = undefined
      customTemplate = undefined
    } else if (argsCount.length <= 4) {
      props = getDefaultPropsForComponent(component, _props)
      options = _customTemplate
      bindings = _bindings
      customTemplate = undefined
    } else {
      props = getDefaultPropsForComponent(component, _props)
      options = _options
      bindings = _bindings
      customTemplate = _customTemplate
    }

    if (customTemplate != null) {
      customCompiledTemplate = componentRegistry.compileTemplate(customTemplate)
    }

    renderingResult = component.render({
      props,
      bindings,
      customCompiledTemplate,
      // handlebars way to get the data that was passed to the main template
      data: options.data.root
    })

    console.log(`COMPONENT ${type} resolved props: ${JSON.stringify(renderingResult.props)}`)

    return new Handlebars.SafeString(renderingResult.content)
  }

  function getDefaultPropsForComponent (component, props) {
    let currentProps = props || {}
    return Object.assign(component.getDefaultProps(), currentProps)
  }

  function getWidthInPercentage (options) {
    return 100 / (options.numberOfCols / options.consumedCols)
  }

  global.getDesignInformation = getDesignInformation
  global.renderDesignGroup = renderDesignGroup
  global.renderDesignItem = renderDesignItem
  global.renderComponent = renderComponent
})(this, INPUTS)
