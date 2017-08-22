import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import './DesignComponent.css'
const componentRegistry = require('../shared/componentRegistry')

const componentSource = {
  beginDrag(props, monitor, component) {
    let componentDimensions

    if (props.onDragStart) {
      props.onDragStart(component.node)
    }

    componentDimensions = component.node.getBoundingClientRect()

    return {
      name: props.type,
      props: props.componentProps,
      size: {
        width: componentDimensions.width,
        height: componentDimensions.height
      }
    }
  },

  endDrag (props) {
    if (props.onDragEnd) {
      props.onDragEnd()
    }
  }
}

function collect (connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

class DesignComponent extends PureComponent {
  constructor (props) {
    super(props)

    this.cacheProps = {}

    this.getComponentRef = this.getComponentRef.bind(this)
    this.connectToDragSourceConditionally = this.connectToDragSourceConditionally.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.renderComponent = this.renderComponent.bind(this)
  }

  componentDidMount () {
    if (!this.props.connectDragPreview) {
      return
    }

    this.props.connectDragPreview(this.node, {
      captureDraggingState: true
    })
  }

  getComponentRef (el) {
    this.node = el

    if (!this.props.componentRef) {
      return
    }

    if (!el) {
      return this.props.componentRef(this.props.type, el)
    }

    this.props.componentRef(this.props.type, findDOMNode(el))
  }

  connectToDragSourceConditionally (...args) {
    const connectDragSource = this.props.connectDragSource
    let element

    if (!connectDragSource) {
      element = args[0]
    } else {
      element = connectDragSource.apply(undefined, args)
    }

    return element
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
    let connectToDragSourceConditionally = this.connectToDragSourceConditionally

    const {
      type,
      componentProps,
      selected,
      isDragging
    } = this.props

    let extraProps = {}

    if (selected) {
      extraProps['data-selected'] = true
    }

    if (isDragging) {
      extraProps['data-dragging'] = true
    }

    return connectToDragSourceConditionally(
      <div
        ref={this.getComponentRef}
        className="DesignComponent"
        {...extraProps}
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
  onClick: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  connectDragSource: PropTypes.func,
  connectDragPreview: PropTypes.func,
  isDragging: PropTypes.bool
}

export default DragSource(ComponentTypes.COMPONENT, componentSource, collect)(DesignComponent)
export { DesignComponent as Component }
