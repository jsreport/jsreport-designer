import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import PropertyControl from './PropertyControl'

class PropertiesEditor extends PureComponent {
  render () {
    const {
      componentType,
      properties,
      bindings,
      expressions,
      options,
      getPropMeta,
      getBindingMeta,
      onBindingEditorOpen,
      onChange
    } = this.props

    let isBindingEnabled

    if (typeof options.bindingEnabled === 'function') {
      isBindingEnabled = options.bindingEnabled({
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
      isBindingEnabled = true
    }

    return (
      <div className='propertiesEditor'>
        {Object.keys(properties).map((propName) => {
          return (
            <PropertyControl
              key={propName}
              componentType={componentType}
              name={propName}
              binding={bindings ? bindings[propName] : null}
              value={properties[propName]}
              bindingEnabled={isBindingEnabled}
              getPropMeta={getPropMeta}
              getBindingMeta={getBindingMeta}
              onBindingEditorOpen={onBindingEditorOpen}
              onChange={onChange}
            />
          )
        })}
      </div>
    )
  }
}

PropertiesEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  properties: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  expressions: PropTypes.object,
  options: PropTypes.object,
  getPropMeta: PropTypes.func.isRequired,
  getBindingMeta: PropTypes.func.isRequired,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func.isRequired
}

export default PropertiesEditor
