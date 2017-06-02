import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ComponentItem from '../ComponentItem'

class ComponentPreviewBox extends Component {
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
        <ComponentItem
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

ComponentPreviewBox.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  component: PropTypes.object.isRequired
}

export default ComponentPreviewBox
