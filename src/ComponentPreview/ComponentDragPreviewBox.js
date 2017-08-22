import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'

class ComponentDragPreviewBox extends PureComponent {
  render () {
    const {
      defaultWidth,
      componentMeta
    } = this.props

    return (
      <div style={{
        width: `${defaultWidth}px`,
        opacity: '0.7'
      }}>
        <DesignComponent
          type={componentMeta.name}
          componentProps={componentMeta.props}
          selected={true}
        />
      </div>
    )
  }
}

ComponentDragPreviewBox.propTypes = {
  defaultWidth: PropTypes.number.isRequired,
  componentMeta: PropTypes.object.isRequired
}

export default ComponentDragPreviewBox
