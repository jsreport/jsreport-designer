import React, { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DragSource } from 'react-dnd'
import DesignComponentHost from './DesignComponentContentHost'
import * as configuration from '../../lib/configuration'
import { getFragmentsNodes, mountFragmentsNodes } from '../../helpers/fragments'
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
    this.fragmentsRefs = null
    this.dataInputChanged = false
    this.customCompiledTemplate = null
    this.renderedContent = null

    this.setComponentCache = this.setComponentCache.bind(this)
    this.getComponentCache = this.getComponentCache.bind(this)
    this.clearComponentCache = this.clearComponentCache.bind(this)

    this.setComponentRef = this.setComponentRef.bind(this)
    this.setFragmentsRef = this.setFragmentsRef.bind(this)

    this.getRawContent = this.getRawContent.bind(this)
    this.mountFragments = this.mountFragments.bind(this)

    this.connectToDragSourceConditionally = this.connectToDragSourceConditionally.bind(this)

    this.renderComponent = this.renderComponent.bind(this)
  }

  componentWillMount () {
    const {
      design,
      template,
      fragments,
      rawContent,
      snapshoot,
      preview,
      addOrRemoveFragmentInstanceInComponent
    } = this.props

    const hasRawContent = rawContent != null
    const componentCache = this.getComponentCache()
    const hasFragments = fragments != null && fragments.size > 0

    if (template != null && !hasRawContent) {
      this.customCompiledTemplate = componentRegistry.compileTemplate(template)
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
      design != null &&
      hasFragments &&
      renderedResult != null &&
      renderedResult.fragments != null &&
      // don't try to add fragment instances when the component is just a preview or
      // snapshoot
      snapshoot !== true &&
      preview !== true
    ) {
      addOrRemoveFragmentInstanceInComponent(
        design.id,
        fragments.values().map(frag => frag.id),
        renderedResult.fragments
      )
    }

    this.renderedContent = renderedResult.content
  }

  componentDidMount () {
    const { dragDisabled } = this.props
    const mountFragments = this.mountFragments
    const componentCache = this.getComponentCache()

    if (componentCache && componentCache.keep) {
      this.setComponentCache({ ...componentCache, keep: false })
    }

    if (!this.props.connectDragPreview) {
      return
    }

    if (dragDisabled !== true) {
      // we need to re-connect to the drag source and preview after mount because
      // our component host dom node is available at this point,
      // in the first render the drag source was attached to null (this.node), so
      // this call is to have everything right after mount
      this.props.connectDragPreview(this.node, {
        captureDraggingState: true
      })

      this.connectToDragSourceConditionally(false)
    }

    if (this.fragmentsRefs == null || Object.keys(this.fragmentsRefs).length === 0) {
      return
    }

    mountFragments(this.node, this.fragmentsRefs)
  }

  componentWillReceiveProps (nextProps) {
    const {
      design,
      fragments,
      snapshoot,
      preview,
      addOrRemoveFragmentInstanceInComponent
    } = nextProps

    const hasRawContent = nextProps.rawContent != null
    const hasFragments = fragments != null && fragments.size > 0
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
    } else if (typeof nextProps.template === 'function' && this.customCompiledTemplate !== nextProps.template) {
      this.customCompiledTemplate = nextProps.template
      this.setComponentCache(undefined)
    } else if (this.getComponentCache() != null && this.getComponentCache().props !== nextProps.componentProps) {
      this.setComponentCache(undefined)
    } else if (this.props.bindings !== nextProps.bindings) {
      this.setComponentCache(undefined)
    }

    if (
      this.getComponentCache() != null &&
      !this.dataInputChanged &&
      this.props.selected !== nextProps.selected
    ) {
      // ignore when only component selected state has changed
      return
    }

    // don't try to render component from template if we have raw content to show
    if (hasRawContent) {
      return
    }

    renderedResult = this.renderComponent(nextProps)

    this.renderedContent = renderedResult.content

    if (
      design != null &&
      hasFragments &&
      renderedResult != null &&
      renderedResult.fragments != null &&
      // don't try to update fragment instances when the component is just a preview or
      // snapshoot
      snapshoot !== true &&
      preview !== true
    ) {
      const staleFragmentsInstances = addOrRemoveFragmentInstanceInComponent(
        design.id,
        fragments.values().map(frag => frag.id),
        renderedResult.fragments
      )

      // stale fragments instances are those whom tag has been changed and will be
      // re-mounted, so we need to clear the cache in order for them to
      // get fresh data on first mount
      if (staleFragmentsInstances.length > 0) {
        staleFragmentsInstances.forEach(stale => this.clearComponentCache(stale.type, stale.id))
      }
    }
  }

  componentDidUpdate (prevProps) {
    const currentProps = this.props
    const hasRawContent = currentProps.rawContent != null
    const mountFragments = this.mountFragments

    if (hasRawContent) {
      return
    }

    if (this.fragmentsRefs == null || Object.keys(this.fragmentsRefs).length === 0) {
      return
    }

    mountFragments(this.node, this.fragmentsRefs)
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

    if (value != null) {
      componentRegistry.componentsCache[this.props.type][this.props.id] = value
    } else {
      this.clearComponentCache(this.props.type, this.props.id)
    }
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

  clearComponentCache (type, id) {
    if (!componentRegistry.componentsCache[type]) {
      return
    }

    delete componentRegistry.componentsCache[type][id]

    if (Object.keys(componentRegistry.componentsCache[type]).length === 0) {
      delete componentRegistry.componentsCache[type]
    }
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

  setFragmentsRef (fragmentId, el) {
    const fragmentsRefs = this.fragmentsRefs || {}

    if (el == null && fragmentsRefs[fragmentId] != null) {
      delete fragmentsRefs[fragmentId]
    } else {
      fragmentsRefs[fragmentId] = el
    }

    this.fragmentsRefs = fragmentsRefs
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

  mountFragments (rootNode, fragmentsCollection) {
    const fragmentsNodes = getFragmentsNodes(rootNode)

    // "mountFragments" will only do something if there is
    // new html comments in current html (fragments placeholders)
    // otherwhise it does nothing
    if (fragmentsNodes.length === 0) {
      return
    }

    mountFragmentsNodes(fragmentsNodes, fragmentsCollection)
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
    fragments,
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
    let fragmentsPlaceholders

    if (componentCache != null && !this.dataInputChanged) {
      shouldRenderAgain = false
    }

    if (shouldRenderAgain) {
      this.dataInputChanged = false

      const renderPayload = {
        props: componentProps,
        bindings,
        expressions,
        fragments,
        data: dataInput,
        computedFields: computedFieldsInput,
        fragmentPlaceholdersOutput: shouldRenderFragmentPlaceholder
      }

      if (type.indexOf('#') === -1) {
        result = componentRegistry.getComponent(type).render(renderPayload)
      } else {
        result = componentRegistry.renderComponentTemplate({
          componentType: type,
          template: customCompiledTemplate
        }, renderPayload)
      }

      fragmentsPlaceholders = !shouldRenderFragmentPlaceholder ? undefined : result.fragments

      this.setComponentCache({
        props: componentProps,
        content: result.content,
        fragmentsPlaceholders
      })

      content = result.content
    } else {
      content = componentCache.content
      fragmentsPlaceholders = componentCache.fragmentsPlaceholders
    }

    return {
      content,
      fragments: fragmentsPlaceholders
    }
  }

  render () {
    const DesignFragment = configuration.elementClasses.fragment
    let connectToDragSourceConditionally = this.connectToDragSourceConditionally

    const {
      root,
      id,
      componentTargetId,
      type,
      rawContent,
      fragments,
      selected,
      preview,
      snapshoot,
      isDragging,
      dragDisabled
    } = this.props

    const shouldRenderFragments = (
      snapshoot !== true &&
      preview !== true &&
      fragments != null &&
      fragments.size > 0
    )

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
        componentId={componentTargetId != null ? componentTargetId : undefined}
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
        {shouldRenderFragments && (
          fragments.keys().map((fragName) => {
            const frag = fragments.get(fragName)

            return (
              <DesignFragment
                // we use tag as key because we want to re-create the component
                // in case the tag is changed
                key={`${frag.mode}/${fragName}`}
                ref={(el) => this.setFragmentsRef(frag.type, el)}
                fragment={frag}
              />
            )
          })
        )}
      </Fragment>
    )
  }
}

DesignComponent.propTypes = {
  design: MobxPropTypes.observableObject,
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
  componentTargetId: PropTypes.string,
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
  addOrRemoveFragmentInstanceInComponent: PropTypes.func,
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
  const { source, id, template, ...restProps } = props

  return {
    design: injected.design,
    id: id != null ? id : source.id,
    type: source.type,
    dataInput: injected.dataInputStore.value,
    computedFieldsInput: injected.dataInputStore.computedFieldsValues,
    template: typeof template === 'function' ? template : source.template,
    componentProps: source.props,
    bindings: source.bindings,
    expressions: source.expressions,
    fragments: source.fragments,
    selected: source.selected,
    ...restProps,
    addOrRemoveFragmentInstanceInComponent: injected.designsActions.addOrRemoveFragmentInstanceInComponent
  }
})(
  DragSource(
    ComponentDragTypes.COMPONENT,
    componentDragSource,
    collectDragSourceProps
  )(ObservableDesignComponent)
)

export { DesignComponent as Component }
