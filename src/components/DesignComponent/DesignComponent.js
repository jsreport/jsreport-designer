import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject } from 'mobx-react'
import { DragSource } from 'react-dnd'
import componentRegistry from '../../../shared/componentRegistry'
import { ComponentDragTypes } from '../../Constants'
import styles from '../../../static/DesignElements.css'
import interactiveStyles from './DesignComponentInteractive.scss'

const componentDragSource = {
  beginDrag (props, monitor, originComponent) {
    let component = originComponent.getInstance()

    if (props.onDragStart) {
      return props.onDragStart(props.component, {
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

function collectDragSourceProps (connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

class DesignComponent extends Component {
  constructor (props) {
    super(props)

    this.dataInputChanged = false
    this.customCompiledTemplate = null

    if (props.template != null && props.rawContent == null) {
      this.customCompiledTemplate = componentRegistry.compileTemplate(props.template)
    }

    this.setComponentCache = this.setComponentCache.bind(this)
    this.getComponentCache = this.getComponentCache.bind(this)

    this.getComponentRef = this.getComponentRef.bind(this)
    this.getRawContent = this.getRawContent.bind(this)
    this.connectToDragSourceConditionally = this.connectToDragSourceConditionally.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.renderComponent = this.renderComponent.bind(this)
  }

  componentWillMount () {
    let componentCache = this.getComponentCache()

    if (componentCache) {
      this.setComponentCache({ ...componentCache, keep: true })
    } else {
      this.setComponentCache(undefined)
    }
  }

  componentDidMount () {
    let componentCache = this.getComponentCache()

    if (componentCache && componentCache.keep) {
      this.setComponentCache({ ...componentCache, keep: false })
    }

    if (!this.props.connectDragPreview) {
      return
    }

    this.props.connectDragPreview(this.node, {
      captureDraggingState: true
    })
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.type !== nextProps.type) {
      this.setComponentCache(undefined)
    }

    if (
      nextProps.bindings != null &&
      (this.props.dataInput !== nextProps.dataInput || this.props.computedFieldsInput !== nextProps.computedFieldsInput)
    ) {
      // the dataInput change is only relevant if the component has bindings
      this.dataInputChanged = true
    }

    if (this.props.template == null && nextProps.template != null) {
      this.customCompiledTemplate = componentRegistry.compileTemplate(nextProps.template)
      this.setComponentCache(undefined)
    } else if (this.props.template != null && nextProps.template == null) {
      this.customCompiledTemplate = null
      this.setComponentCache(undefined)
    } else if (this.props.bindings !== nextProps.bindings) {
      this.setComponentCache(undefined)
    }
  }

  componentWillUnmount () {
    let componentCache = this.getComponentCache()

    if (componentCache && componentCache.keep) {
      return
    }

    this.setComponentCache(undefined)
  }

  setComponentCache (value) {
    componentRegistry.componentsCache[this.props.type] = componentRegistry.componentsCache[this.props.type] || {}
    componentRegistry.componentsCache[this.props.type][this.props.id] = value
  }

  getComponentCache () {
    if (
      !componentRegistry.componentsCache[this.props.type] ||
      !componentRegistry.componentsCache[this.props.type][this.props.id]
    ) {
      return
    }

    return componentRegistry.componentsCache[this.props.type][this.props.id]
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

  getRawContent () {
    let componentCache = this.getComponentCache()

    if (componentCache) {
      return componentCache.content
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
      // eslint-disable-next-line no-useless-call
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
    const { bindings, expressions, dataInput, computedFieldsInput } = this.props
    const customCompiledTemplate = this.customCompiledTemplate
    const componentCache = this.getComponentCache()
    const renderComponentFromTemplate = componentRegistry.getComponent(type).render
    let shouldRenderAgain = true
    let result
    let content

    if (componentCache != null && componentCache.props === componentProps && !this.dataInputChanged) {
      shouldRenderAgain = false
    }

    if (shouldRenderAgain) {
      this.dataInputChanged = false

      result = renderComponentFromTemplate({
        props: componentProps,
        bindings,
        expressions,
        customCompiledTemplate,
        data: dataInput,
        computedFields: computedFieldsInput
      })

      this.setComponentCache({
        props: componentProps,
        content: result.content
      })

      content = result.content
    } else {
      content = componentCache.content
    }

    return content
  }

  render () {
    let connectToDragSourceConditionally = this.connectToDragSourceConditionally

    const {
      id,
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
        id={id}
        className={`${styles.designComponent} ${interactiveStyles.designComponentInteractive}`}
        {...extraProps}
        data-jsreport-interactive-component
        data-jsreport-component
        data-jsreport-component-id={id}
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
  type: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  computedFieldsInput: PropTypes.object,
  template: PropTypes.string,
  componentProps: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  expressions: PropTypes.object,
  rawContent: PropTypes.string,
  selected: PropTypes.bool,
  selectedPreview: PropTypes.bool,
  componentRef: PropTypes.func,
  onClick: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  connectDragSource: PropTypes.func,
  connectDragPreview: PropTypes.func,
  isDragging: PropTypes.bool
}

@observer
class ObservableDesignComponent extends Component {
  constructor (props) {
    super(props)

    this.setInstance = this.setInstance.bind(this)
    this.getInstance = this.getInstance.bind(this)
  }

  setInstance (el) {
    this.instance = el
  }

  getInstance () {
    return this.instance
  }

  render () {
    return (
      <DesignComponent ref={this.setInstance} {...this.props} />
    )
  }
}

export default inject((injected, props) => {
  let { component, ...restProps } = props

  return {
    id: component.id,
    type: component.type,
    dataInput: injected.dataInputStore.value,
    computedFieldsInput: injected.dataInputStore.computedFieldsValues,
    template: component.template,
    componentProps: component.props,
    bindings: component.bindings,
    expressions: component.expressions,
    selected: component.selected,
    ...restProps
  }
})(
  DragSource(
    ComponentDragTypes.COMPONENT,
    componentDragSource,
    collectDragSourceProps
  )(ObservableDesignComponent)
)

export { DesignComponent as Component }
