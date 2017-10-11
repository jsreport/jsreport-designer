import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ComponentDragTypes } from '../../Constants'
import './DesignComponent.css'
const componentRegistry = require('../../shared/componentRegistry')

const componentSource = {
  beginDrag(props, monitor, component) {
    if (props.onDragStart) {
      return props.onDragStart({
        component: component.getIndex(),
        ...component.getComponentInfo()
      }, {
        node: component.node,
        instance: component
      })
    }

    return {}
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
    this.dataInputChanged = false
    this.customCompiledTemplate = null

    if (props.template != null && props.rawContent == null) {
      this.customCompiledTemplate = componentRegistry.compileTemplate(props.template)
    }

    this.getIndex = this.getIndex.bind(this)
    this.getComponentRef = this.getComponentRef.bind(this)
    this.getComponentInfo = this.getComponentInfo.bind(this)
    this.getRawContent = this.getRawContent.bind(this)
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

  componentWillReceiveProps (nextProps) {
    if (this.props.type !== nextProps.type) {
      this.cacheProps = {}
    }

    if (this.props.dataInput !== nextProps.dataInput) {
      this.dataInputChanged = true
    }

    if (this.props.template == null && nextProps.template != null) {
      this.customCompiledTemplate = componentRegistry.compileTemplate(nextProps.template)
      this.cacheProps = {}
    } else if (this.props.template != null && nextProps.template == null) {
      this.customCompiledTemplate = null
      this.cacheProps = {}
    } else if (this.props.bindings !== nextProps.bindings) {
      this.cacheProps = {}
    }
  }

  getIndex () {
    if (!this.props.getIndex) {
      return
    }

    return this.props.getIndex(this.props.id)
  }

  getComponentRef (el) {
    this.node = el

    if (!this.props.componentRef) {
      return
    }

    if (!el) {
      return this.props.componentRef(this.props.type, el, this)
    }

    this.props.componentRef(this.props.type, findDOMNode(el), this)
  }

  getTemporalNode () {
    if (this.tmpNode) {
      return this.tmpNode
    }

    this.tmpNode = document.createElement('div')
    return this.tmpNode
  }

  getComponentInfo () {
    let info = {
      id: this.props.id,
      type: this.props.type,
      props: this.props.componentProps
    }

    if (this.props.bindings != null) {
      info.bindings = this.props.bindings
    }

    if (this.props.template != null) {
      info.template = this.props.template
    }

    return info
  }

  getRawContent () {
    if (this.cacheProps && this.cacheProps[this.props.type]) {
      return this.cacheProps[this.props.type].content
    }

    return null
  }

  connectToDragSourceConditionally (...args) {
    const connectDragSource = this.props.connectDragSource
    let element

    if (!connectDragSource) {
      return args[0]
    }

    if (this.props.isDragging) {
      // while dragging we change the drag source to a temporal node that it is not attached to the DOM,
      // this is needed to instruct react-dnd that it should cancel the default dragend's animation (snap back of item)
      connectDragSource.apply(undefined, [this.getTemporalNode(), ...args.slice(1)])
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
    const { bindings, dataInput } = this.props
    const customCompiledTemplate = this.customCompiledTemplate
    const renderComponentFromTemplate = componentRegistry.getComponentFromType(type).render
    let shouldRenderAgain = true
    let result
    let content

    if (this.cacheProps[type] == null) {
      this.cacheProps = {}
    } else if (this.cacheProps[type].props === componentProps && !this.dataInputChanged) {
      shouldRenderAgain = false
    }

    if (shouldRenderAgain) {
      this.dataInputChanged = false

      result = renderComponentFromTemplate({
        props: componentProps,
        bindings,
        customCompiledTemplate,
        data: dataInput != null ? dataInput.data : null,
      })

      this.cacheProps[type] = {
        props: componentProps,
        content: result.content
      }

      content = result.content
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
      rawContent,
      selected,
      selectedPreview,
      isDragging
    } = this.props

    let extraProps = {}

    if (selected) {
      extraProps['data-selected'] = true
    }

    if (selectedPreview) {
      extraProps['data-selected-preview'] = true
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
        dangerouslySetInnerHTML={{
          __html: rawContent == null ? this.renderComponent(type, componentProps) : rawContent
        }}
      />
    )
  }
}

DesignComponent.propTypes = {
  id: PropTypes.string,
  selected: PropTypes.bool,
  selectedPreview: PropTypes.bool,
  type: PropTypes.string.isRequired,
  template: PropTypes.string,
  componentProps: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  rawContent: PropTypes.string,
  componentRef: PropTypes.func,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onClick: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  getIndex: PropTypes.func,
  connectDragSource: PropTypes.func,
  connectDragPreview: PropTypes.func,
  isDragging: PropTypes.bool
}

export default DragSource(ComponentDragTypes.COMPONENT, componentSource, collect)(DesignComponent)
export { DesignComponent as Component }
