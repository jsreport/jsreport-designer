import React, { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DragSource } from 'react-dnd'
import DesignComponentHost from './DesignComponentContentHost'
import * as configuration from '../../lib/configuration'
import { mountFragments } from '../../helpers/fragments'
import htmlElementPropType from '../../helpers/htmlElementPropType'
import componentRegistry from '../../../shared/componentRegistry'
import { ComponentDragTypes } from '../../Constants'

const componentDragSource = {
  beginDrag (props, monitor, originComponent) {
    let component = originComponent.getInstance()

    if (props.onDragStart) {
      return props.onDragStart(props.source, {
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

    this.node = null
    this.fragmentsInstances = null
    this.dataInputChanged = false
    this.customCompiledTemplate = null
    this.renderedContent = null

    if (props.template != null && props.rawContent == null) {
      this.customCompiledTemplate = componentRegistry.compileTemplate(props.template)
    }

    this.setComponentCache = this.setComponentCache.bind(this)
    this.getComponentCache = this.getComponentCache.bind(this)

    this.setComponentRef = this.setComponentRef.bind(this)
    this.setFragmentsRef = this.setFragmentsRef.bind(this)

    this.getRawContent = this.getRawContent.bind(this)

    this.connectToDragSourceConditionally = this.connectToDragSourceConditionally.bind(this)

    this.renderComponent = this.renderComponent.bind(this)
  }

  componentWillMount () {
    const { designId, id, snapshoot, preview, addFragmentToComponent } = this.props
    const hasRawContent = this.props.rawContent != null
    const componentCache = this.getComponentCache()
    let hasFragments = false

    if (
      this.props.fragments != null &&
      this.props.fragments.size > 0
    ) {
      hasFragments = true
    }

    if (componentCache) {
      this.setComponentCache({ ...componentCache, keep: true })
    } else {
      this.setComponentCache(undefined)
    }

    // don't try to render component from template if we have raw content to show
    if (hasRawContent) {
      return
    }

    const renderedResult = this.renderComponent(this.props)

    if (
      designId != null &&
      renderedResult != null &&
      renderedResult.fragments != null &&
      !hasFragments &&
      snapshoot !== true &&
      preview !== true
    ) {
      let fragmentsToInsert = []

      Object.keys(renderedResult.fragments).forEach((fragmentName) => {
        const fragment = renderedResult.fragments[fragmentName]

        fragmentsToInsert.push({
          name: fragment.name,
          type: fragment.type,
          mode: fragment.mode,
          tag: fragment.tag,
          content: fragment.content,
          template: fragment.template,
          props: {
            value: 'Sample fragment value'
          }
        })
      })

      addFragmentToComponent(designId, id, fragmentsToInsert)
    }

    this.renderedContent = renderedResult.content
  }

  componentDidMount () {
    const { dragDisabled } = this.props
    const componentCache = this.getComponentCache()

    if (componentCache && componentCache.keep) {
      this.setComponentCache({ ...componentCache, keep: false })
    }

    if (!this.props.connectDragPreview) {
      return
    }

    if (dragDisabled !== true) {
      this.props.connectDragPreview(this.node, {
        captureDraggingState: true
      })
    }

    if (this.fragmentsInstances == null || Object.keys(this.fragmentsInstances).length === 0) {
      return
    }

    mountFragments(this.fragmentsInstances, this.node)

    if (dragDisabled !== true) {
      // we need to connect to the drag source after mount because
      // our component host dom node is available at this point,
      // in the first render the drag source was attached to null (this.node), so
      // this call is to have everything right after mount
      this.connectToDragSourceConditionally(false)
    }
  }

  componentWillReceiveProps (nextProps) {
    const hasRawContent = nextProps.rawContent != null
    let renderedResult

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

    // don't try to render component from template if we have raw content to show
    if (hasRawContent) {
      return
    }

    renderedResult = this.renderComponent(nextProps)

    this.renderedContent = renderedResult.content
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

  setComponentRef (el) {
    this.node = el

    if (!this.props.componentRef) {
      return
    }

    if (!el) {
      return this.props.componentRef(this.props.type, el, this)
    }

    this.props.componentRef(this.props.type, el, this)
  }

  setFragmentsRef (fragmentName, el) {
    const fragmentsInstances = this.fragmentsInstances || {}

    fragmentsInstances[fragmentName] = el

    this.fragmentsInstances = fragmentsInstances
  }

  getTemporalNodeForDrag () {
    if (this.tmpNode) {
      return this.tmpNode
    }

    this.tmpNode = document.createElement('div')
    return this.tmpNode
  }

  getRawContent () {
    // when component has fragments take the raw content
    // directly from DOM
    if (
      this.props.fragments != null &&
      this.props.fragments.size > 0
    ) {
      return this.node.innerHTML
    }

    let componentCache = this.getComponentCache()

    if (componentCache) {
      return componentCache.content
    }

    return null
  }

  connectToDragSourceConditionally (isDragging, ...args) {
    const { connectDragSource } = this.props
    let element

    if (!connectDragSource) {
      return args[0]
    }

    if (isDragging) {
      // while dragging we change the drag source to a temporal node that it is not attached to the DOM,
      // this is needed to instruct react-dnd that it should cancel the default dragend's animation (snap back of item)
      // eslint-disable-next-line no-useless-call
      connectDragSource.apply(undefined, [this.getTemporalNodeForDrag(), ...args.slice(1)])
      element = args[0]
    } else {
      // eslint-disable-next-line no-useless-call
      connectDragSource.apply(undefined, [this.node, ...args.slice(1)])
      element = args[0]
    }

    return element
  }

  renderComponent ({
    type,
    componentProps,
    bindings,
    expressions,
    dataInput,
    computedFieldsInput,
    preview
  }) {
    const customCompiledTemplate = this.customCompiledTemplate
    const componentCache = this.getComponentCache()
    const shouldRenderFragmentPlaceholder = preview !== true
    let shouldRenderAgain = true
    let result
    let content
    let fragments

    if (componentCache != null && componentCache.props === componentProps && !this.dataInputChanged) {
      shouldRenderAgain = false
    }

    if (shouldRenderAgain) {
      this.dataInputChanged = false

      const renderPayload = {
        props: componentProps,
        bindings,
        expressions,
        customCompiledTemplate,
        data: dataInput,
        computedFields: computedFieldsInput,
        fragmentPlaceholders: shouldRenderFragmentPlaceholder
      }

      if (type.indexOf('#') === -1) {
        result = componentRegistry.getComponent(type).render(renderPayload)
      } else {
        result = componentRegistry.renderComponentTemplate({
          template: customCompiledTemplate
        }, renderPayload)
      }

      fragments = !shouldRenderFragmentPlaceholder ? undefined : result.fragments

      this.setComponentCache({
        props: componentProps,
        content: result.content,
        fragments
      })

      content = result.content
    } else {
      content = componentCache.content
      fragments = componentCache.fragments
    }

    return {
      content,
      fragments
    }
  }

  render () {
    const DesignFragment = configuration.elementClasses.fragment
    let connectToDragSourceConditionally = this.connectToDragSourceConditionally

    const {
      root,
      id,
      type,
      rawContent,
      fragments,
      selected,
      snapshoot,
      isDragging,
      dragDisabled
    } = this.props

    let content

    if (rawContent == null) {
      content = this.renderedContent
    } else {
      content = rawContent
    }

    let componentHostEl = (
      <DesignComponentHost
        key={`${type}-${id}(${root != null ? 'node' : 'relement'})`}
        nodeRef={this.setComponentRef}
        id={id}
        type={type}
        root={root != null ? root : 'div'}
        content={content}
        selected={selected}
        snapshoot={snapshoot}
        isDragging={isDragging}
      />
    )

    if (dragDisabled !== true) {
      componentHostEl = connectToDragSourceConditionally(isDragging, componentHostEl)
    }

    return (
      <Fragment>
        {componentHostEl}
        {fragments != null && fragments.size > 0 && (
          fragments.keys().map((fragName) => (
            <DesignFragment
              key={fragName}
              ref={(el) => this.setFragmentsRef(fragName, el)}
              fragment={fragments.get(fragName)}
            />
          ))
        )}
      </Fragment>
    )
  }
}

DesignComponent.propTypes = {
  designId: PropTypes.string,
  root: htmlElementPropType(true),
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  computedFieldsInput: PropTypes.object,
  template: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func
  ]),
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  componentProps: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  expressions: PropTypes.object,
  fragments: MobxPropTypes.observableMap,
  rawContent: PropTypes.string,
  selected: PropTypes.bool,
  snapshoot: PropTypes.bool,
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  preview: PropTypes.bool,
  dragDisabled: PropTypes.bool,
  componentRef: PropTypes.func,
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  onDragStart: PropTypes.func,
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  onDragEnd: PropTypes.func,
  addFragmentToComponent: PropTypes.func,
  connectDragSource: PropTypes.func,
  connectDragPreview: PropTypes.func,
  isDragging: PropTypes.bool
}

DesignComponent.defaultProps = {
  selected: false,
  snapshoot: false,
  preview: false,
  dragDisabled: false
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
  let { source, ...restProps } = props

  return {
    designId: injected.design.id,
    id: source.id,
    type: source.type,
    dataInput: injected.dataInputStore.value,
    computedFieldsInput: injected.dataInputStore.computedFieldsValues,
    template: source.template,
    componentProps: source.props,
    bindings: source.bindings,
    expressions: source.expressions,
    fragments: source.fragments,
    selected: source.selected,
    ...restProps,
    addFragmentToComponent: injected.designsActions.addFragmentToComponent
  }
})(
  DragSource(
    ComponentDragTypes.COMPONENT,
    componentDragSource,
    collectDragSourceProps
  )(ObservableDesignComponent)
)

export { DesignComponent as Component }
