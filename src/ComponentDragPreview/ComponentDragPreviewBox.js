import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignComponent from '../DesignComponent'

class ComponentDragPreviewBox extends PureComponent {
  render () {
    const {
      width,
      height,
      component
    } = this.props

    return (
      <div style={{
        display: 'inline-block',
        opacity: '0.7'
      }}>
        <DesignComponent
          type={component.name}
          width={width}
          height={height}
          componentProps={component.props}
          isSelected={true}
        />
      </div>
    )
  }
}

ComponentDragPreviewBox.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  component: PropTypes.object.isRequired
}

export default ComponentDragPreviewBox
