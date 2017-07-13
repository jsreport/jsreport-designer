import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
const componentRegistry = require('../shared/componentRegistry')

class DesignComponent extends Component {
  constructor (props) {
    super(props)

    this.getComponentRef = this.getComponentRef.bind(this)
  }

  getComponentRef (el) {
    if (!this.props.componentRef) {
      return
    }

    if (!el) {
      return this.props.componentRef(this.props.type, el)
    }

    this.props.componentRef(this.props.type, findDOMNode(el))
  }

  render () {
    const {
      type,
      componentProps,
      isSelected
    } = this.props

    const renderComponent = componentRegistry.getComponentFromType(type).render

    let styles = {
      display: 'inline-block'
    }

    if (isSelected) {
      // is important to use outline because outline does not consume
      // the width and height of element
      styles.outline = '1px dashed rgba(0, 0, 0, 0.5)'
      styles.pointerEvents = 'none'
    }

    return (
      <div
        ref={this.getComponentRef}
        style={styles}
        data-jsreport-component-type={type}
        dangerouslySetInnerHTML={{ __html: renderComponent(componentProps) }}
      />
    )
  }
}

DesignComponent.propTypes = {
  isSelected: PropTypes.bool,
  type: PropTypes.string.isRequired,
  componentProps: PropTypes.object.isRequired,
  componentRef: PropTypes.func
}

export default DesignComponent
