import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import PropertyControl from './PropertyControl'
import './PropertiesEditor.css'

class PropertiesEditor extends PureComponent {
  render () {
    const {
      componentType,
      properties,
      bindings,
      dataInput,
      getPropMeta,
      onBindToDataClick,
      onEditRichContentClick,
      onChange
    } = this.props

    return (
      <div className="PropertiesEditor">
        {Object.keys(properties).map((propName) => {
          return (
            <PropertyControl
              key={propName}
              componentType={componentType}
              name={propName}
              binding={bindings ? bindings[propName] : null}
              value={properties[propName]}
              bindToData={dataInput == null ? false : true}
              getPropMeta={getPropMeta}
              onBindToDataClick={onBindToDataClick}
              onEditRichContentClick={onEditRichContentClick}
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
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  properties: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  getPropMeta: PropTypes.func.isRequired,
  onBindToDataClick: PropTypes.func,
  onEditRichContentClick: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  connectToChangesInterceptor: PropTypes.func.isRequired
}

export default PropertiesEditor
