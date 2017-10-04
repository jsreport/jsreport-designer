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
      getMeta,
      onBindToDataClick,
      onEditRichContentClick,
      onValueChange
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
              getMeta={getMeta}
              onBindToDataClick={onBindToDataClick}
              onEditRichContentClick={onEditRichContentClick}
              onValueChange={onValueChange}
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
  getMeta: PropTypes.func.isRequired,
  onBindToDataClick: PropTypes.func,
  onEditRichContentClick: PropTypes.func,
  onValueChange: PropTypes.func.isRequired
}

export default PropertiesEditor
