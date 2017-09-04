import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'

class ComponentDragPreviewBox extends PureComponent {
  render () {
    const {
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
          componentProps={componentMeta.props}
          selectedPreview={true}
        />
      </div>
    )
  }
}

ComponentDragPreviewBox.propTypes = {
  width: PropTypes.number.isRequired,
  componentMeta: PropTypes.object.isRequired
}

export default ComponentDragPreviewBox
