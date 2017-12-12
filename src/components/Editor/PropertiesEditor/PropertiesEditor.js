import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import PropertyControl from './PropertyControl'

class PropertiesEditor extends PureComponent {
  render () {
    const {
      componentType,
      properties,
      bindings,
      dataInput,
      getPropMeta,
      getExpressionMeta,
      onSelectDataFieldClick,
      onEditRichContentClick,
      onChange
    } = this.props

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
              bindToData={dataInput != null}
              getPropMeta={getPropMeta}
              getExpressionMeta={getExpressionMeta}
              onSelectDataFieldClick={onSelectDataFieldClick}
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
  getExpressionMeta: PropTypes.func.isRequired,
  onSelectDataFieldClick: PropTypes.func,
  onEditRichContentClick: PropTypes.func,
  onChange: PropTypes.func.isRequired
}

export default PropertiesEditor
