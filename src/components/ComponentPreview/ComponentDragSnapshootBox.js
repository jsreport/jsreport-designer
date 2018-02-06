import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'

class ComponentDragSnapshootBox extends PureComponent {
  render () {
    const {
      dataInput,
      width,
      componentMeta
    } = this.props

    return (
      <div style={{
        width: `${width}px`,
        opacity: '0.4'
      }}>
        <DesignComponent
          id={`dragPreview${componentMeta.name}`}
          type={componentMeta.name}
          dataInput={dataInput}
          componentProps={componentMeta.props}
          bindings={componentMeta.bindings}
          rawContent={componentMeta.rawContent}
          snapshoot
          dragDisabled
        />
      </div>
    )
  }
}

ComponentDragSnapshootBox.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  width: PropTypes.number.isRequired,
  componentMeta: PropTypes.object.isRequired
}

export default ComponentDragSnapshootBox
