import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
const componentRegistry = require('../shared/componentRegistry')

class DesignComponent extends PureComponent {
  constructor (props) {
    super(props)

    this.cacheProps = {}

    this.getComponentRef = this.getComponentRef.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.renderComponent = this.renderComponent.bind(this)
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

  handleClick (ev) {
    if (this.props.onClick) {
      this.props.onClick(ev, this.props.id)
    }
  }

  renderComponent (type, componentProps) {
    const renderComponentFromTemplate = componentRegistry.getComponentFromType(type).render
    let shouldRenderAgain = true
    let content

    if (this.cacheProps[type] == null) {
      this.cacheProps = {}
    } else if (this.cacheProps[type].props === componentProps) {
      shouldRenderAgain = false
    }

    if (shouldRenderAgain) {
      content = renderComponentFromTemplate(componentProps)

      this.cacheProps[type] = {
        props: componentProps,
        content: content
      }
    } else {
      content = this.cacheProps[type].content
    }

    return content
  }

  render () {
    const {
      type,
      componentProps,
      selected
    } = this.props

    let styles = {
      display: 'inline-block',
      position: 'relative',
      cursor: 'move'
    }

    if (selected) {
      // is important to use outline because outline does not consume
      // the width and height of element
      styles.outline = '1px dashed rgba(0, 0, 0, 0.8)'
      styles.zIndex = 1
    }

    return (
      <div
        ref={this.getComponentRef}
        style={styles}
        data-jsreport-component-type={type}
        onClick={this.handleClick}
        dangerouslySetInnerHTML={{ __html: this.renderComponent(type, componentProps) }}
      />
    )
  }
}

DesignComponent.propTypes = {
  id: PropTypes.string,
  selected: PropTypes.bool,
  type: PropTypes.string.isRequired,
  componentProps: PropTypes.object.isRequired,
  componentRef: PropTypes.func,
  onClick: PropTypes.func
}

export default DesignComponent
