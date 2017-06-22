import React, { Component } from 'react'
import PropTypes from 'prop-types'
const componentRegistry = require('../shared/componentRegistry')

class ComponentItem extends Component {
  renderComponent (type, componentProps) {
    let ComponentType = componentRegistry.getComponentFromType(type)

    return (
      <ComponentType {...componentProps} />
    )
  }

  render () {
    const {
      type,
      width,
      height,
      componentProps,
      isSelected
    } = this.props

    let styles = {
      display: 'inline-block',
      width: `${width}px`,
      height: `${height}px`
    }

    if (isSelected) {
      // is important to use outline because outline does not consume
      // the width of height of element
      styles.outline = '1px dashed rgba(0, 0, 0, 0.5)'
      styles.pointerEvents = 'none'
    }

    return (
      <div style={styles}>
        {this.renderComponent(type, componentProps)}
      </div>
    )
  }
}

ComponentItem.propTypes = {
  type: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  componentProps: PropTypes.object.isRequired
}

export default ComponentItem
