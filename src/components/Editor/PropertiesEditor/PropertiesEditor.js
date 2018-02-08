import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import isStyleProp from '../../../../shared/isStyleProp'
import PropertiesGroup from './PropertiesGroup'
import PropertyControl from './PropertyControl'

class PropertiesEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.getPropertiesDefined = this.getPropertiesDefined.bind(this)
    this.stylePropCheck = this.stylePropCheck.bind(this)
    this.renderPropertyControl = this.renderPropertyControl.bind(this)
  }

  getPropertiesDefined () {
    const { getComponentMeta } = this.props
    const componentMeta = getComponentMeta()

    if (componentMeta.propsMeta == null) {
      return []
    }

    return Object.keys(componentMeta.propsMeta)
  }

  stylePropCheck (propName) {
    const { getPropMeta } = this.props
    const propMeta = getPropMeta(propName)

    return isStyleProp(propMeta)
  }

  renderPropertyControl (propName) {
    const {
      componentType,
      dataInput,
      properties,
      bindings,
      expressions,
      options,
      getComponent,
      getPropMeta,
      getBindingMeta,
      onBindingEditorOpen,
      onChange
    } = this.props

    let isBindingEnabled

    if (typeof options.bindingEnabled === 'function') {
      isBindingEnabled = options.bindingEnabled(propName, {
        componentType,
        properties,
        bindings,
        expressions,
        getPropMeta
      })

      if (isBindingEnabled == null) {
        isBindingEnabled = true
      }
    } else {
      isBindingEnabled = dataInput != null
    }

    let propsForControl = {
      componentType,
      name: propName,
      binding: bindings ? bindings[propName] : null,
      value: properties[propName],
      bindingEnabled: isBindingEnabled,
      getComponent,
      getPropMeta,
      getBindingMeta,
      onBindingEditorOpen,
      onChange
    }

    if (options.controls != null && options.controls[propName] != null) {
      return (
        <PropertyControl
          key={`prop-${propName}`}
          {...propsForControl}
          renderValue={options.controls[propName]}
        />
      )
    }

    return (
      <PropertyControl
        key={`prop-${propName}`}
        {...propsForControl}
      />
    )
  }

  render () {
    const { getPropertiesDefined, stylePropCheck } = this
    const { options } = this.props

    const namesOfProperties = getPropertiesDefined()

    let order = []
    let customOrder = false

    if (Array.isArray(options.order)) {
      order = options.order
      customOrder = true
    } else {
      order = namesOfProperties
    }

    return (
      <div className='propertiesEditor'>
        {order.map((propName) => {
          if (typeof propName !== 'string' && propName.group != null) {
            return (
              <PropertiesGroup
                key={`group-${propName.group}`}
                name={propName.group}
              >
                {Array.isArray(propName.items) && propName.items.map((pName) => {
                  if (pName == null || namesOfProperties.indexOf(pName) === -1) {
                    return null
                  }

                  return this.renderPropertyControl(pName)
                })}
              </PropertiesGroup>
            )
          }

          if (propName == null || namesOfProperties.indexOf(propName) === -1) {
            return null
          }

          if (!customOrder && stylePropCheck(propName)) {
            // render style prop in group by default if
            // there is no custom order specified
            return (
              <PropertiesGroup
                key={`group-${propName}`}
                name={propName}
              >
                {this.renderPropertyControl(propName)}
              </PropertiesGroup>
            )
          }

          return this.renderPropertyControl(propName)
        })}
      </div>
    )
  }
}

PropertiesEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  properties: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  expressions: PropTypes.object,
  options: PropTypes.object,
  getComponent: PropTypes.func.isRequired,
  getComponentMeta: PropTypes.func.isRequired,
  getPropMeta: PropTypes.func.isRequired,
  getBindingMeta: PropTypes.func.isRequired,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func.isRequired
}

export default PropertiesEditor
