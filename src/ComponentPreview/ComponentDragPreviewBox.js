import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'

class ComponentDragPreviewBox extends PureComponent {
  render () {
    const {
      dataInput,
      width,
      componentMeta
    } = this.props

    return (
      <div style={{
        width: `${width}px`,
        opacity: '0.7'
      }}>
        <DesignComponent
          type={componentMeta.name}
          dataInput={dataInput}
          componentProps={componentMeta.props}
          bindings={componentMeta.bindings}
          rawContent={componentMeta.rawContent}
          selectedPreview={true}
        />
      </div>
    )
  }
}

ComponentDragPreviewBox.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  width: PropTypes.number.isRequired,
  componentMeta: PropTypes.object.isRequired
}

export default ComponentDragPreviewBox
